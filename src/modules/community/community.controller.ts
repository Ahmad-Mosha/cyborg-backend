import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Put,
} from '@nestjs/common';
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
  async createPost(@Request() req, @Body() createPostDto: CreatePostDto) {
    return await this.communityService.createPost(req.user, createPostDto);
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
  async deletePost(@Request() req, @Param('id') id: string) {
    return await this.communityService.deletePost(id, req.user);
  }

  // Comment Endpoints
  @Post('posts/:postId/comments')
  async createComment(
    @Request() req,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return await this.communityService.createComment(
      req.user,
      postId,
      createCommentDto,
    );
  }

  // Like Endpoints
  @Post('posts/:postId/like')
  async toggleLike(@Request() req, @Param('postId') postId: string) {
    return await this.communityService.toggleLike(req.user, postId);
  }

  // Admin Endpoints
  @Put('posts/:id/moderate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async moderatePost(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: PostStatus,
  ) {
    return await this.communityService.moderatePost(req.user, id, status);
  }
}
