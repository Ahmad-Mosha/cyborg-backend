import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from '../../users/entities/user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { LikeTargetType } from '../dto/create-like.dto';

@Entity('likes')
@Unique(['userId', 'postId'])
@Unique(['userId', 'commentId'])
export class Like extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn()
  post: Post;

  @Column({ nullable: true })
  postId: string;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn()
  comment: Comment;

  @Column({ nullable: true })
  commentId: string;
  @Column({
    type: 'varchar'
  })
  targetType: LikeTargetType;
}