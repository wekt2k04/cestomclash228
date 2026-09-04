import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { BountyStatus } from '../bounty-status.enum';

@Entity('bounties')
export class Bounty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  // Position reelle - jamais lue en JS directement, toujours via ST_X/ST_Y
  // (meme convention que Pin, voir pins/entities/pin.entity.ts).
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location: string;

  @ManyToOne(() => City, { eager: true })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column({ type: 'uuid' })
  cityId: string;

  @Column({ type: 'enum', enum: BountyStatus, default: BountyStatus.OPEN })
  status: BountyStatus;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'claimedById' })
  claimedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  claimedById: string | null;

  // Horodatage serveur faisant autorite - jamais un countdown calcule
  // seulement cote client (voir docs/ARCHITECTURE.md).
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  // Notation (docs/PLAN_EXTENSION.md § Pivot 2026-08-31, Increment 3bis) :
  // l'auteur note la personne qui a reclame/resolu, jamais l'inverse (c'est
  // l'auteur qui juge si l'aide recue etait de qualite) - voir
  // BountiesService.rate(). ratingValue reste null tant que non note, pas 0
  // (0 serait une vraie note basse, pas "pas encore note").
  @Column({ type: 'smallint', nullable: true })
  ratingValue: number | null;

  @Column({ type: 'text', nullable: true })
  ratingComment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
