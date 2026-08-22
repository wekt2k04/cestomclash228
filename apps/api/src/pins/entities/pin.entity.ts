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
import { PinType } from '../pin-type.enum';

@Entity('pins')
export class Pin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @Column({ type: 'enum', enum: PinType })
  type: PinType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  // Position reelle - jamais lue en JS directement (valeur WKB brute),
  // toujours via ST_X/ST_Y dans PinsService.
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location: string;

  // Deduite automatiquement de `location` a la creation (ville la plus
  // proche) - jamais fournie directement par le client, voir PinsService.
  @ManyToOne(() => City, { eager: true })
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column({ type: 'uuid' })
  cityId: string;

  @CreateDateColumn()
  createdAt: Date;
}
