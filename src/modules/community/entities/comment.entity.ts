// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
//   UpdateDateColumn,
// } from 'typeorm';
// import { User } from '../../users/entities/user.entity';
// import { Post } from './post.entity';

// @Entity('comments')
// export class Comment {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column('text')
//   content: string;

//   @ManyToOne(() => User, (user) => user.comments)
//   author: User;

//   @ManyToOne(() => Post, (post) => post.comments)
//   post: Post;

//   @ManyToOne(() => Comment, { nullable: true })
//   parentComment: Comment;

//   @Column({ default: false })
//   isEdited: boolean;

//   @Column({ default: false })
//   isDeleted: boolean;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }
