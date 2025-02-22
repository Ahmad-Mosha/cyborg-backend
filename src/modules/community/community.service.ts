import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post, PostType, PostStatus } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateLikeDto, LikeTargetType } from './dto/create-like.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>
  ) {}

  // Posts methods
async createPost(user: User, createPostDto: CreatePostDto) {
    const post = this.postRepository.create({
      ...createPostDto,
      author: user,
      authorId: user.id
    });
    return await this.postRepository.save(post);
  }

  async getPosts({ page = 1, limit = 10, type, status = PostStatus.PUBLISHED }) {
    const query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.status = :status', { status });

    if (type) {
      query.andWhere('post.type = :type', { type });
    }

    const [posts, total] = await query
      .orderBy('post.isPinned', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getPost(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author']
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto, user: User) {
    const post = await this.getPost(id);

    if (post.authorId !== user.id) {
      throw new UnauthorizedException('You can only update your own posts');
    }

    Object.assign(post, updatePostDto);
    
    return await this.postRepository.save(post);
  }

  async deletePost(id: string, user: User) {
    const post = await this.getPost(id);

    if (post.authorId !== user.id) {
      throw new UnauthorizedException('You can only delete your own posts');
    }

    await this.postRepository.remove(post);
  }

  // Comments methods
  async createComment(user: User, postId: string, createCommentDto: CreateCommentDto) {
    const post = await this.getPost(postId);

    if (post.isLocked) {
      throw new BadRequestException('This post is locked and cannot receive new comments');
    }

    let parentComment: Comment | null = null;
    if (createCommentDto.parentCommentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentCommentId }
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      post,
      postId,
      author: user,
      authorId: user.id,
      parentComment
    });

    return await this.commentRepository.save(comment);
  }

  async getComments(postId: string, { page = 1, limit = 10 }) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { postId },
      relations: ['author', 'parentComment'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      items: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    }
    };
}

    async deleteComment(id: string, user: User) {
        const comment = await this.commentRepository.findOne({
        where: { id },
        relations: ['author']
    });

    if (!comment) {
        throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== user.id) {
        throw new UnauthorizedException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
}

  // Likes methods
    async createLike(user: User, createLikeDto: CreateLikeDto) {
        const { targetType, targetId } = createLikeDto;
        const postId = targetType === LikeTargetType.POST ? targetId : undefined;
        const commentId = targetType === LikeTargetType.COMMENT ? targetId : undefined;

    // Validate target exists
    if (targetType === LikeTargetType.POST) {
        await this.getPost(postId);
    } else {
        const comment = await this.commentRepository.findOne({
        where: { id: commentId }
});
        if (!comment) {
            throw new NotFoundException('Comment not found');
    }
    }
    const existingLike = await this.likeRepository.findOne({
        where: targetType === LikeTargetType.POST
        ? { userId: user.id, postId }
        : { userId: user.id, commentId }
    });

    if (existingLike) {
        throw new BadRequestException('You have already liked this item');
    }

    const like = this.likeRepository.create({
        user,
        userId: user.id,
        targetType,
        ...(targetType === LikeTargetType.POST ? { postId } : { commentId })
    });

    await this.likeRepository.save(like);

    // Update likes count
    if (targetType === LikeTargetType.POST) {
        await this.postRepository.increment({ id: postId }, 'likesCount', 1);
    } else {
        await this.commentRepository.increment({ id: commentId }, 'likesCount', 1);
    }

    return like;
}

    async deleteLike(id: string, user: User) {
        const like = await this.likeRepository.findOne({
        where: { id },
        relations: ['post', 'comment']
    });

    if (!like) {
        throw new NotFoundException('Like not found');
    }

    if (like.userId !== user.id) {
        throw new UnauthorizedException('You can only remove your own likes');
    }

    await this.likeRepository.remove(like);

    // hena Update likes count
    if (like.targetType === LikeTargetType.POST) {
        await this.postRepository.decrement({ id: like.postId }, 'likesCount', 1);
    } else {
        await this.commentRepository.decrement({ id: like.commentId }, 'likesCount', 1);
    }
}

  // Admin methods lesa 3ayza at2aked eno el user admin
  /*  async togglePin(id: string) {
        const post = await this.getPost(id);
        post.isPinned = !post.isPinned;
        return await this.postRepository.save(post);
}

    async toggleLock(id: string) {
        const post = await this.getPost(id);
        post.isLocked = !post.isLocked;
        return await this.postRepository.save(post);
}

    async moderatePost(id: string, status: PostStatus) {
        const post = await this.getPost(id);
        post.status = status;
        return await this.postRepository.save(post);
} */
}