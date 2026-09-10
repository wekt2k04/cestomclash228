import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Bounty } from '../../bounties/entities/bounty.entity';
import { BountyInterestStatus } from '../bounty-interest-status.enum';

// Une ligne par candidat interesse par une Bounty PAYANTE (priceMad != null) - plusieurs
// candidats peuvent coexister tant que l'auteur n'en a accepte aucun (voir
// BountyInterestsService.expressInterest()). Contrainte unique (bountyId, userId) en base :
// une seule proposition par personne et par Bounty. Index unique PARTIEL supplementaire (WHERE
// status='accepted') : au plus 1 candidat "accepted" a la fois pour une meme Bounty, garanti
// par la base meme sous 2 acceptations concurrentes (voir la migration
// 1788700000000-AddBountyInterestsAndChat.ts).
@Entity('bounty_interests')
export class BountyInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Bounty, { eager: true })
  @JoinColumn({ name: 'bountyId' })
  bounty: Bounty;

  @Column({ type: 'uuid' })
  bountyId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: BountyInterestStatus,
    default: BountyInterestStatus.PENDING,
  })
  status: BountyInterestStatus;

  // URL vers une image deja hebergee (pas d'upload de fichier - meme limitation assumee et deja
  // en place pour sponsorship-request.entity.ts, voir cette entite pour le raisonnement complet
  // : aucune infra de stockage provisionnee, hors contrainte "100% palier gratuit").
  @Column({ type: 'varchar', nullable: true })
  proofImageUrl: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  proofSubmittedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
