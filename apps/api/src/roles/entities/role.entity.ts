import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { City } from '../../cities/entities/city.entity';
import { RoleScope } from '../role-scope.enum';

// Un seul role elevé par utilisateur pour le MVP (pas de multi-role) - un
// membre sans ligne ici est un membre ordinaire (aucun privilege).
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  userId: string;

  @Column({ type: 'enum', enum: RoleScope })
  scope: RoleScope;

  // requis si scope=local, null si scope=national
  @ManyToOne(() => City, { nullable: true, eager: true })
  @JoinColumn({ name: 'cityId' })
  city: City | null;

  // type explicite requis pour un union type (string | null), voir la note
  // equivalente dans user.entity.ts.
  @Column({ type: 'uuid', nullable: true })
  cityId: string | null;
}
