// import {
//   Injectable,
//   NotFoundException,
//   ForbiddenException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Post, PostStatus } from './entities/post.entity';
// import { Comment } from './entities/comment.entity';
// import { Like } from './entities/like.entity';
// import { CreatePostDto } from './dto/create-post.dto';
// import { CreateCommentDto } from './dto/create-comment.dto';
// import { User } from '../users/entities/user.entity';

// @Injectable()
// export class CommunityService {
//   constructor(
//     @InjectRepository(Post)
//     private postRepository: Repository<Post>,
//     @InjectRepository(Comment)
//     private commentRepository: Repository<Comment>,
//     @InjectRepository(Like)
//     private likeRepository: Repository<Like>,
//   ) {}

//   // Post Methods
//   async createPost(user: User, createPostDto: CreatePostDto): Promise<Post> {
//     const post = this.postRepository.create({
//       ...createPostDto,
//       author: user,
//     });
//     return await this.postRepository.save(post);
//   }

//   async getPosts(
//     page: number = 1,
//     limit: number = 10,
//   ): Promise<[Post[], number]> {
//     return await this.postRepository.findAndCount({
//       where: { status: PostStatus.ACTIVE },
//       relations: ['author', 'likes', 'comments'],
//       order: { createdAt: 'DESC' },
//       skip: (page - 1) * limit,
//       take: limit,
//     });
//   }

//   async getPost(id: string): Promise<Post> {
//     const post = await this.postRepository.findOne({
//       where: { id, status: PostStatus.ACTIVE },
//       relations: ['author', 'comments', 'comments.author', 'likes'],
//     });

//     if (!post) {
//       throw new NotFoundException('Post not found');
//     }

//     return post;
//   }

//   async deletePost(id: string, user: User): Promise<void> {
//     const post = await this.postRepository.findOne({
//       where: { id },
//       relations: ['author'],
//     });

//     if (!post) {
//       throw new NotFoundException('Post not found');
//     }

//     if (post.author.id !== user.id && !user.roles.includes('admin')) {
//       throw new ForbiddenException('You cannot delete this post');
//     }

//     post.status = PostStatus.DELETED;
//     await this.postRepository.save(post);
//   }

//   // Comment Methods
//   async createComment(
//     user: User,
//     postId: string,
//     createCommentDto: CreateCommentDto,
//   ): Promise<Comment> {
//     const post = await this.postRepository.findOne({
//       where: { id: postId, status: PostStatus.ACTIVE },
//     });

//     if (!post) {
//       throw new NotFoundException('Post not found');
//     }

//     let parentComment: Comment | null = null;
//     if (createCommentDto.parentCommentId) {
//       parentComment = await this.commentRepository.findOne({
//         where: { id: createCommentDto.parentCommentId },
//       });
//       if (!parentComment) {
//         throw new NotFoundException('Parent comment not found');
//       }
//     }

//     const comment = this.commentRepository.create({
//       content: createCommentDto.content,
//       author: user,
//       post,
//       parentComment,
//     });

//     const savedComment = await this.commentRepository.save(comment);
//     post.commentsCount += 1;
//     await this.postRepository.save(post);

//     return savedComment;
//   }

//   // Like Methods
//   async toggleLike(user: User, postId: string): Promise<{ liked: boolean }> {
//     const post = await this.postRepository.findOne({
//       where: { id: postId, status: PostStatus.ACTIVE },
//     });

//     if (!post) {
//       throw new NotFoundException('Post not found');
//     }

//     const existingLike = await this.likeRepository.findOne({
//       where: { user: { id: user.id }, post: { id: postId } },
//     });

//     if (existingLike) {
//       await this.likeRepository.remove(existingLike);
//       post.likesCount -= 1;
//       await this.postRepository.save(post);
//       return { liked: false };
//     }

//     const like = this.likeRepository.create({
//       user,
//       post,
//     });
//     await this.likeRepository.save(like);
//     post.likesCount += 1;
//     await this.postRepository.save(post);
//     return { liked: true };
//   }

//   // Admin Methods
//   async moderatePost(
//     user: User,
//     postId: string,
//     status: PostStatus,
//   ): Promise<Post> {
//     if (!user.roles.includes('admin')) {
//       throw new ForbiddenException('Only admins can moderate posts');
//     }

//     const post = await this.postRepository.findOne({
//       where: { id: postId },
//     });

//     if (!post) {
//       throw new NotFoundException('Post not found');
//     }

//     post.status = status;
//     return await this.postRepository.save(post);
//   }
// }
