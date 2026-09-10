import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Bounty } from '../bounties/entities/bounty.entity';
import { BountyStatus } from '../bounties/bounty-status.enum';
import { containsContactInfo } from '../common/contact-filter';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(Bounty)
    private readonly bounties: Repository<Bounty>,
  ) {}

  // Idempotent (ON CONFLICT DO NOTHING sur la contrainte unique bountyId) - appelee depuis 2
  // chemins distincts qui font toujours passer une Bounty a CLAIMED (BountiesService.claim(),
  // gratuit ; BountyInterestsService.confirmPayment(), payant) - jamais de risque d'une 2e
  // conversation pour la meme Bounty meme si les 2 chemins finissaient par se chevaucher un
  // jour.
  async ensureConversationForBounty(bountyId: string): Promise<void> {
    await this.conversations.query(
      `INSERT INTO conversations (id, "bountyId") VALUES (uuid_generate_v4(), $1)
       ON CONFLICT ("bountyId") DO NOTHING`,
      [bountyId],
    );
  }

  private async requireParticipant(
    userId: string,
    bountyId: string,
  ): Promise<Bounty> {
    const bounty = await this.bounties.findOne({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty introuvable.');
    if (bounty.authorId !== userId && bounty.claimedById !== userId) {
      throw new ForbiddenException(
        "Seuls l'auteur et la personne qui a pris en charge cette Bounty peuvent voir ce chat.",
      );
    }
    return bounty;
  }

  // Liste vide (pas d'erreur) si la conversation n'existe pas encore : un participant legitime
  // qui interroge cet endpoint juste avant que la transition CLAIMED ne soit pleinement visible
  // (course benigne, tres bref) ne doit pas voir une erreur deroutante - le prochain poll (20s,
  // voir POLL_INTERVAL_MS cote frontend) la trouvera.
  async listMessages(userId: string, bountyId: string): Promise<Message[]> {
    await this.requireParticipant(userId, bountyId);
    const conversation = await this.conversations.findOne({
      where: { bountyId },
    });
    if (!conversation) return [];
    return this.messages.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'ASC' },
    });
  }

  async postMessage(
    userId: string,
    bountyId: string,
    body: string,
  ): Promise<Message> {
    const bounty = await this.requireParticipant(userId, bountyId);
    // CLAIMED ou RESOLUE (pas avant) - le chat reste utilisable apres resolution (un dernier
    // mot avant de noter), jamais coupe net des que resolve() est appele.
    if (
      bounty.status !== BountyStatus.CLAIMED &&
      bounty.status !== BountyStatus.RESOLVED
    ) {
      throw new ConflictException(
        'Le chat est disponible une fois la Bounty prise en charge.',
      );
    }
    if (containsContactInfo(body)) {
      throw new BadRequestException(
        "Ce message semble contenir des coordonnées personnelles (numéro, email, réseau social) - reste dans l'appli pour la sécurité de tous.",
      );
    }
    const conversation = await this.conversations.findOne({
      where: { bountyId },
    });
    if (!conversation) throw new ConflictException('Conversation introuvable.');
    const message = this.messages.create({
      conversationId: conversation.id,
      authorId: userId,
      body,
    });
    return this.messages.save(message);
  }
}
