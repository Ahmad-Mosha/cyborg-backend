import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from '../../users/entities/user.entity';
import { Post } from './post.entity';
import { Like } from './like.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column('text')
  content: string;

  @ManyToOne(() => Post, post => post.comments)
  @JoinColumn()
  post: Post;

  @Column()
  postId: string;

  @ManyToOne(() => User, user => user.comments)
  @JoinColumn()
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn()
  parentComment: Comment;

  @Column({ nullable: true })
  parentCommentId: string;

  @OneToMany(() => Like, like => like.comment)
  likes: Like[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: false })
  isEdited: boolean;
}
