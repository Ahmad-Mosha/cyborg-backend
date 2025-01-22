import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';

export enum PostType {
  QUESTION = 'question',
  PROGRESS = 'progress',
  GENERAL = 'general',
}

export enum PostStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'simple-enum',
    enum: PostType,
    default: PostType.GENERAL,
  })
  type: PostType;

  @Column({
    type: 'simple-enum',
    enum: PostStatus,
    default: PostStatus.ACTIVE,
  })
  status: PostStatus;

  @Column('text', {
    default: '[]',
    transformer: {
      to: (value: string[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  tags: string[];

  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column('text', {
    nullable: true,
    transformer: {
      to: (value: string[]) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : []),
    },
  })
  attachments: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
