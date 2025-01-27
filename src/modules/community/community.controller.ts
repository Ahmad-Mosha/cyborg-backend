import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostStatus } from './entities/post.entity';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Post Endpoints
  @Post('posts')
  async createPost(
    @GetUser() user: User,
    @Body() createPostDto: CreatePostDto,
  ) {
    return await this.communityService.createPost(user, createPostDto);
  }

  @Get('posts')
  async getPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.communityService.getPosts(page, limit);
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string) {
    return await this.communityService.getPost(id);
  }

  @Delete('posts/:id')
  async deletePost(@GetUser() user: User, @Param('id') id: string) {
    return await this.communityService.deletePost(id, user);
  }

  // Comment Endpoints
  @Post('posts/:postId/comments')
  async createComment(
    @GetUser() user: User,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return await this.communityService.createComment(
      user,
      postId,
      createCommentDto,
    );
  }

  // Like Endpoints
  @Post('posts/:postId/like')
  async toggleLike(@GetUser() user: User, @Param('postId') postId: string) {
    return await this.communityService.toggleLike(user, postId);
  }

  // Admin Endpoints
  @Put('posts/:id/moderate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async moderatePost(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('status') status: PostStatus,
  ) {
    return await this.communityService.moderatePost(user, id, status);
  }
}
