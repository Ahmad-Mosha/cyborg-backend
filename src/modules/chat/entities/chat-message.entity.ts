import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatConversation } from './chat-conversation.entity';

export enum MessageRole {
  USER = 'user',
  AI = 'ai',
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({
    type: 'varchar',
    enum: MessageRole,
  })
  role: MessageRole;

  @ManyToOne(() => ChatConversation, (conversation) => conversation.messages)
  conversation: ChatConversation;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}