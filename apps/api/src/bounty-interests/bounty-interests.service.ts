import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BountyInterest } from './entities/bounty-interest.entity';
import { BountyInterestStatus } from './bounty-interest-status.enum';
import { Bounty } from '../bounties/entities/bounty.entity';
import { BountyStatus } from '../bounties/bounty-status.enum';
import { ChatService } from '../chat/chat.service';

export type TrustBadge = 'nouveau' | 'actif' | 'fiable';

export interface CandidateView {
  id: string;
  userId: string;
  displayName: string;
  status: BountyInterestStatus;
  proofImageUrl: string | null;
  proofSubmittedAt: Date | null;
  createdAt: Date;
  completedCount: number;
  averageRating: number | null;
  trustBadge: TrustBadge;
}

// Seuils delibere simples (pas un score compose a 5 facteurs) - le but est un signal de
// confiance LISIBLE en un coup d'oeil pour un etudiant qui choisit, pas un classement precis.
// "fiable" : au moins 3 Bounties payantes menees a terme ET une moyenne correcte (>=4/5) - une
// seule bonne note ne suffit pas a se dire "fiable". "actif" : au moins 1 completee, quel que
// soit le rating (pas encore assez d'historique pour juger la qualite, mais a deja livre).
// "nouveau" : aucun historique - ni positif ni negatif, juste inconnu.
function deriveTrustBadge(
  completedCount: number,
  averageRating: number | null,
): TrustBadge {
  if (completedCount >= 3 && averageRating !== null && averageRating >= 4) {
    return 'fiable';
  }
  if (completedCount >= 1) return 'actif';
  return 'nouveau';
}

@Injectable()
export class BountyInterestsService {
  constructor(
    @InjectRepository(BountyInterest)
    private readonly interests: Repository<BountyInterest>,
    @InjectRepository(Bounty)
    private readonly bounties: Repository<Bounty>,
    private readonly chat: ChatService,
  ) {}

  async expressInterest(
    userId: string,
    bountyId: string,
  ): Promise<BountyInterest> {
    const bounty = await this.bounties.findOne({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty introuvable.');
    if (bounty.priceMad === null) {
      throw new BadRequestException(
        'Cette Bounty est gratuite - prenez-la en charge directement, pas besoin de proposer votre aide.',
      );
    }
    if (bounty.authorId === userId) {
      throw new BadRequestException(
        'Vous ne pouvez pas proposer votre aide sur votre propre Bounty.',
      );
    }
    if (bounty.status !== BountyStatus.OPEN) {
      throw new ConflictException(
        "Cette Bounty n'accepte plus de nouvelles propositions.",
      );
    }
    try {
      const interest = this.interests.create({ bountyId, userId });
      return await this.interests.save(interest);
    } catch (err) {
      // Contrainte unique (bountyId, userId) - vrai filet de securite contre 2 propositions
      // quasi simultanees de la meme personne, le check d'existence seul (lire-puis-ecrire) ne
      // le garantirait pas. 23505 = violation de contrainte unique (SQLSTATE Postgres).
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          'Vous avez déjà proposé votre aide sur cette Bounty.',
        );
      }
      throw err;
    }
  }

  // Reponse a "est-ce que J'AI deja propose mon aide ici ?" - distinct de findCandidates()
  // (reserve a l'auteur, voit TOUS les candidats) : n'importe quel candidat potentiel doit
  // pouvoir retrouver l'etat de SA PROPRE proposition apres un rechargement de page, sans jamais
  // voir celles des autres.
  async findMine(
    userId: string,
    bountyId: string,
  ): Promise<BountyInterest | null> {
    return this.interests.findOne({ where: { bountyId, userId } });
  }

  async findCandidates(
    actorId: string,
    bountyId: string,
  ): Promise<CandidateView[]> {
    const bounty = await this.bounties.findOne({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty introuvable.');
    if (bounty.authorId !== actorId) {
      throw new ForbiddenException(
        "Seul l'auteur de cette Bounty peut voir les propositions reçues.",
      );
    }

    const rows: Array<{
      id: string;
      userid: string;
      displayname: string;
      status: BountyInterestStatus;
      proofimageurl: string | null;
      proofsubmittedat: Date | null;
      createdat: Date;
      completed: string;
      avgrating: string | null;
    }> = await this.interests.query(
      `SELECT
         bi.id AS id, bi."userId" AS userid, u."displayName" AS displayname,
         bi.status AS status, bi."proofImageUrl" AS proofimageurl,
         bi."proofSubmittedAt" AS proofsubmittedat, bi."createdAt" AS createdat,
         COALESCE(stats.completed, 0) AS completed, stats.avgrating AS avgrating
       FROM bounty_interests bi
       JOIN users u ON u.id = bi."userId"
       LEFT JOIN (
         SELECT "claimedById" AS "userId",
                COUNT(*) AS completed,
                AVG("ratingValue") FILTER (WHERE "ratingValue" IS NOT NULL) AS avgrating
         FROM bounties
         WHERE status = 'resolved' AND "claimedById" IS NOT NULL
         GROUP BY "claimedById"
       ) stats ON stats."userId" = bi."userId"
       WHERE bi."bountyId" = $1
       ORDER BY bi."createdAt" ASC`,
      [bountyId],
    );

    return rows.map((r) => {
      const completedCount = Number(r.completed);
      const averageRating = r.avgrating === null ? null : Number(r.avgrating);
      return {
        id: r.id,
        userId: r.userid,
        displayName: r.displayname,
        status: r.status,
        proofImageUrl: r.proofimageurl,
        proofSubmittedAt: r.proofsubmittedat,
        createdAt: r.createdat,
        completedCount,
        averageRating,
        trustBadge: deriveTrustBadge(completedCount, averageRating),
      };
    });
  }

  // Accepte UN candidat, decline automatiquement les autres propositions encore en attente de
  // la meme Bounty - decision explicite de l'auteur, jamais un choix par defaut/silencieux.
  async accept(actorId: string, interestId: string): Promise<BountyInterest> {
    const interest = await this.interests.findOne({
      where: { id: interestId },
    });
    if (!interest) throw new NotFoundException('Proposition introuvable.');
    const bounty = await this.bounties.findOne({
      where: { id: interest.bountyId },
    });
    if (!bounty) throw new NotFoundException('Bounty introuvable.');
    if (bounty.authorId !== actorId) {
      throw new ForbiddenException(
        "Seul l'auteur de cette Bounty peut accepter une proposition.",
      );
    }

    try {
      // Le WHERE status='pending' protege contre une double-acceptation de CETTE MEME
      // proposition ; l'index unique partiel (voir la migration) protege contre l'acceptation
      // concurrente de 2 propositions DIFFERENTES de la meme Bounty - un WHERE conditionnel seul
      // ne le pourrait pas, ces 2 UPDATE portant sur des lignes differentes.
      const [rows] = await this.interests.query<
        [Array<{ id: string }>, number]
      >(
        `UPDATE bounty_interests SET status = 'accepted'
         WHERE id = $1 AND status = 'pending'
         RETURNING id`,
        [interestId],
      );
      if (rows.length === 0) {
        throw new ConflictException('Cette proposition a déjà été traitée.');
      }
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          'Une autre proposition a déjà été acceptée pour cette Bounty.',
        );
      }
      throw err;
    }

    await this.interests.query(
      `UPDATE bounty_interests SET status = 'declined'
       WHERE "bountyId" = $1 AND id != $2 AND status = 'pending'`,
      [interest.bountyId, interestId],
    );

    const updated = await this.interests.findOne({ where: { id: interestId } });
    if (!updated) throw new NotFoundException('Proposition introuvable.');
    return updated;
  }

  async submitProof(
    actorId: string,
    interestId: string,
    proofImageUrl: string,
  ): Promise<BountyInterest> {
    const [rows] = await this.interests.query<[Array<{ id: string }>, number]>(
      `UPDATE bounty_interests
       SET "proofImageUrl" = $1, "proofSubmittedAt" = now()
       WHERE id = $2 AND "userId" = $3 AND status = 'accepted'
       RETURNING id`,
      [proofImageUrl, interestId, actorId],
    );
    if (rows.length === 0) {
      const interest = await this.interests.findOne({
        where: { id: interestId },
      });
      if (!interest) throw new NotFoundException('Proposition introuvable.');
      if (interest.userId !== actorId) {
        throw new ForbiddenException(
          'Seule la personne dont la proposition a été acceptée peut transmettre une preuve.',
        );
      }
      throw new ConflictException(
        "Cette proposition n'est pas (ou plus) au stade de l'acceptation.",
      );
    }
    const updated = await this.interests.findOne({ where: { id: interestId } });
    if (!updated) throw new NotFoundException('Proposition introuvable.');
    return updated;
  }

  // Etape finale : l'auteur confirme avoir reçu le paiement. 1 requete atomique (clone direct de
  // SponsorshipService.applyDecision()) qui fait passer la Bounty a CLAIMED - c'est SEULEMENT a
  // partir d'ici que resolve()/rate() (bounties.service.ts, tous 2 inchanges) entrent en jeu,
  // exactement comme pour une Bounty gratuite reclamee directement.
  async confirmPayment(
    actorId: string,
    interestId: string,
  ): Promise<BountyInterest> {
    const interest = await this.interests.findOne({
      where: { id: interestId },
    });
    if (!interest) throw new NotFoundException('Proposition introuvable.');
    const bounty = await this.bounties.findOne({
      where: { id: interest.bountyId },
    });
    if (!bounty) throw new NotFoundException('Bounty introuvable.');
    if (bounty.authorId !== actorId) {
      throw new ForbiddenException(
        "Seul l'auteur de cette Bounty peut confirmer la réception du paiement.",
      );
    }
    if (!interest.proofImageUrl) {
      throw new ConflictException(
        "Aucune preuve de paiement n'a encore été transmise.",
      );
    }

    const [interestRows] = await this.interests.query<
      [Array<{ id: string }>, number]
    >(
      `UPDATE bounty_interests SET status = 'confirmed'
       WHERE id = $1 AND status = 'accepted' AND "proofImageUrl" IS NOT NULL
       RETURNING id`,
      [interestId],
    );
    if (interestRows.length === 0) {
      throw new ConflictException('Ce paiement a déjà été confirmé.');
    }

    // Meme condition atomique que BountiesService.claim() (status='open' obligatoire) - la
    // Bounty reste OPEN jusqu'ici (voir le commentaire de la classe), donc cette 2e requete ne
    // peut logiquement s'appliquer qu'une seule fois, sur la Bounty exacte visee par CETTE
    // proposition.
    await this.bounties.query(
      `UPDATE bounties SET status = 'claimed', "claimedById" = $1
       WHERE id = $2 AND status = 'open'`,
      [interest.userId, interest.bountyId],
    );
    await this.chat.ensureConversationForBounty(interest.bountyId);

    const updated = await this.interests.findOne({ where: { id: interestId } });
    if (!updated) throw new NotFoundException('Proposition introuvable.');
    return updated;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}
