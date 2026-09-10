import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bounty } from '../../bounties/entities/bounty.entity';

// 1 conversation par Bounty CLAIMED (gratuite ou payante), jamais 2 - voir
// ChatService.ensureConversationForBounty() (INSERT ... ON CONFLICT DO NOTHING sur la
// contrainte unique bountyId, idempotent : appelee depuis 2 chemins distincts -
// BountiesService.claim() et BountyInterestsService.confirmPayment() - sans jamais risquer
// d'en creer 2).
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Bounty)
  @JoinColumn({ name: 'bountyId' })
  bounty: Bounty;

  @Column({ type: 'uuid', unique: true })
  bountyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
