import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SponsorshipRequest } from './entities/sponsorship-request.entity';
import { SponsorshipStatus } from './sponsorship-status.enum';
import { CreateSponsorshipRequestDto } from './dto/create-sponsorship-request.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class SponsorshipService {
  constructor(
    @InjectRepository(SponsorshipRequest)
    private readonly requests: Repository<SponsorshipRequest>,
    private readonly roles: RolesService,
  ) {}

  create(
    requesterId: string,
    dto: CreateSponsorshipRequestDto,
  ): Promise<SponsorshipRequest> {
    const request = this.requests.create({
      requesterId,
      description: dto.description,
      amountDeclared: dto.amountDeclared,
      proofImageUrl: dto.proofImageUrl,
      status: SponsorshipStatus.PENDING,
    });
    return this.requests.save(request);
  }

  findMine(requesterId: string): Promise<SponsorshipRequest[]> {
    return this.requests.find({
      where: { requesterId },
      order: { createdAt: 'DESC' },
    });
  }

  // File d'attente du verificateur - reservee au scope national (voir
  // RolesService.isVerifier), jamais exposee publiquement (montants declares
  // et preuves de virement sont des donnees sensibles).
  async findPending(actorId: string): Promise<SponsorshipRequest[]> {
    await this.roles.requireVerifierScope(actorId);
    return this.requests.find({
      where: { status: SponsorshipStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  // Liste publique des sponsors approuves - c'est la contrepartie visible du
  // privilege ("reel et visible en liste", voir docs/PLAN_EXTENSION.md § Increment
  // 3). Champs sensibles (montant declare, URL de preuve, qui a verifie)
  // deliberement absents de cette vue - seule findOne() (reservee au
  // demandeur/verificateur) les expose.
  async findApprovedPublic(): Promise<
    Array<{ id: string; description: string; requesterDisplayName: string }>
  > {
    const rows = await this.requests.find({
      where: { status: SponsorshipStatus.APPROVED },
      order: { reviewedAt: 'DESC' },
    });
    return rows.map((r) => ({
      id: r.id,
      description: r.description,
      requesterDisplayName: r.requester.displayName,
    }));
  }

  async findOne(actorId: string, id: string): Promise<SponsorshipRequest> {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Demande introuvable.');
    if (request.requesterId === actorId) return request;
    const isVerifier = await this.roles.isVerifier(actorId);
    if (!isVerifier) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que vos propres demandes.',
      );
    }
    return request;
  }

  async approve(verifierId: string, id: string): Promise<SponsorshipRequest> {
    await this.roles.requireVerifierScope(verifierId);
    return this.applyDecision(verifierId, id, SponsorshipStatus.APPROVED, null);
  }

  async reject(
    verifierId: string,
    id: string,
    reason?: string,
  ): Promise<SponsorshipRequest> {
    await this.roles.requireVerifierScope(verifierId);
    return this.applyDecision(
      verifierId,
      id,
      SponsorshipStatus.REJECTED,
      reason ?? null,
    );
  }

  // UPDATE conditionnel unique (meme pattern que BountiesService.claim()),
  // jamais un lire-puis-ecrire - trouve par security-review avant ce commit,
  // 2 problemes reels distincts corriges par la MEME requete atomique :
  // (1) deux verificateurs (plusieurs comptes au scope national peuvent
  // exister, voir RolesService.assign()) qui trancheraient la meme demande
  // quasi simultanement ne doivent pas pouvoir s'ecraser silencieusement l'un
  // l'autre ; (2) "requesterId" != $2 empeche un verificateur d'approuver/
  // rejeter SA PROPRE demande - faille critique trouvee par l'audit : sans ce
  // garde, un national s'auto-certifiait "sponsor verifie" sans aucun controle
  // tiers, annulant tout l'interet du mecanisme (aucune passerelle de paiement
  // ne le rattrape derriere, voir sponsorship-request.entity.ts).
  private async applyDecision(
    verifierId: string,
    id: string,
    status: SponsorshipStatus.APPROVED | SponsorshipStatus.REJECTED,
    rejectionReason: string | null,
  ): Promise<SponsorshipRequest> {
    // Meme piege TypeORM que claim() (bounties.service.ts) : un UPDATE...
    // RETURNING renvoie un tuple [rows, rowCount], pas directement le tableau.
    const [rows] = await this.requests.query<[Array<{ id: string }>, number]>(
      `UPDATE sponsorship_requests
       SET status = $1, "reviewedById" = $2, "reviewedAt" = now(), "rejectionReason" = $3
       WHERE id = $4 AND status = 'pending' AND "requesterId" != $2
       RETURNING id`,
      [status, verifierId, rejectionReason, id],
    );

    if (rows.length === 0) {
      const request = await this.requests.findOne({ where: { id } });
      if (!request) throw new NotFoundException('Demande introuvable.');
      if (request.requesterId === verifierId) {
        throw new ForbiddenException(
          'Vous ne pouvez pas vérifier votre propre demande.',
        );
      }
      if (request.status !== SponsorshipStatus.PENDING) {
        throw new ConflictException('Cette demande a déjà été traitée.');
      }
      throw new ConflictException('Impossible de traiter cette demande.');
    }

    const updated = await this.requests.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Demande introuvable.');
    return updated;
  }
}
