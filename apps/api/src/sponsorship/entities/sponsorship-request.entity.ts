import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SponsorshipStatus } from '../sponsorship-status.enum';

// "Sponsoring verifie" (docs/PLAN_EXTENSION.md § Pivot 2026-08-31, docs/BUSINESS_PLAN.md § 6.1) :
// aucune passerelle de paiement tierce - le payeur fait un vrai virement vers un compte CESTOM
// dedie (hors de ce systeme) puis soumet une preuve ici. amountDeclared est ce que le payeur
// AFFIRME avoir vire, pas un montant traite par l'app - le verifieur le confronte au releve
// bancaire reel avant d'approuver. proofImageUrl est une URL vers une image deja hebergee
// (pas d'upload de fichier : aucune infra de stockage n'est encore provisionnee, voir Increment
// 1a) - limitation assumee et documentee, pas cachee.
@Entity('sponsorship_requests')
export class SponsorshipRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column()
  requesterId: string;

  @Column({ type: 'text' })
  description: string;

  // numeric revient en string depuis le driver pg par defaut - transformer
  // explicite pour que l'API serialise un vrai number, pas une chaine
  // (bug de confusion type sinon, deja rencontre ailleurs dans ce projet -
  // voir la note UPDATE...RETURNING de bounties.service.ts).
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amountDeclared: number;

  @Column({ type: 'varchar' })
  proofImageUrl: string;

  @Column({
    type: 'enum',
    enum: SponsorshipStatus,
    default: SponsorshipStatus.PENDING,
  })
  status: SponsorshipStatus;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
