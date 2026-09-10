import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  // Filtre anti-coordonnees deja applique avant l'ecriture (voir
  // ChatService.postMessage()/common/contact-filter.ts) - jamais applique ici, cette colonne
  // contient toujours du texte deja valide.
  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn()
  createdAt: Date;
}
