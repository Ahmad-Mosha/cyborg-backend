import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';

export enum PostType {
  QUESTION = 'question',
  DISCUSSION = 'discussion',
  ANNOUNCEMENT = 'announcement',
  GENERAL = 'general'
}

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  HIDDEN = 'hidden'
}

@Entity('posts')
@Index(['type', 'status'])
export class Post extends BaseEntity {
  @Column()
  @Index()
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'varchar',
    default: PostType.GENERAL
  })
  type: PostType;

  @Column({
    type: 'varchar',
    default: PostStatus.PUBLISHED
  })
  status: PostStatus;

  @Column('simple-array', { default: '' })
  tags: string[];

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn()
  author: User;

  @Column()
  authorId: string;

  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];

  @OneToMany(() => Like, like => like.post)
  likes: Like[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column('simple-array', { nullable: true })
  attachments: string[];

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isLocked: boolean;
}