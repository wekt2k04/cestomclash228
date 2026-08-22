import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { City } from '../../cities/entities/city.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // null si le compte a ete cree uniquement via Google OAuth. type explicite
  // requis : TypeORM ne peut pas deduire le type Postgres d'un union type
  // (string | null) depuis les metadonnees de reflexion TS (constate a
  // l'execution : DataTypeNotSupportedError sans le `type` explicite).
  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash: string | null;

  // null si le compte n'a jamais utilise Google OAuth
  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column()
  displayName: string;

  @ManyToOne(() => City, { nullable: true, eager: true })
  @JoinColumn({ name: 'homeCityId' })
  homeCity: City | null;

  @Column({ type: 'uuid', nullable: true })
  homeCityId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
