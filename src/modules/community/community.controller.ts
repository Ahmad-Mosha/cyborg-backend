import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateLikeDto } from './dto/create-like.dto';
import { PostType, PostStatus } from './entities/post.entity';

@ApiTags('Community')
@Controller('community')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Posts endpoints
  @Post('posts')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Post created successfully' })
  createPost(
    @GetUser() user: User,
    @Body() createPostDto: CreatePostDto
  ) {
    return this.communityService.createPost(user, createPostDto);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get all posts with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: PostType })
  @ApiQuery({ name: 'status', required: false, enum: PostStatus })
  getPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: PostType,
    @Query('status') status: PostStatus = PostStatus.PUBLISHED
  ) {
    return this.communityService.getPosts({ page, limit, type, status });
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get a specific post' })
  getPost(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityService.getPost(id);
  }

  @Put('posts/:id')
  @ApiOperation({ summary: 'Update a post' })
  updatePost(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto
  ) {
    return this.communityService.updatePost(id, updatePostDto, user);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete a post' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePost(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.communityService.deletePost(id, user);
  }

  // Comments endpoints
  @Post('posts/:postId/comments')
  @ApiOperation({ summary: 'Create a comment' })
  createComment(
    @GetUser() user: User,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return this.communityService.createComment(user, postId, createCommentDto);
  }

  @Get('posts/:postId/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  getComments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.communityService.getComments(postId, { 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete a comment' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.communityService.deleteComment(id, user);
  }

  // Likes endpoints
  @Post('likes')
  @ApiOperation({ summary: 'Create a like' })
  createLike(
    @GetUser() user: User,
    @Body() createLikeDto: CreateLikeDto
  ) {
    return this.communityService.createLike(user, createLikeDto);
  }

  @Delete('likes/:id')
  @ApiOperation({ summary: 'Remove a like' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLike(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.communityService.deleteLike(id, user);
  }

  

  // Admin endpoints
  //@Put('posts/:id/pin')
  //@UseGuards(RolesGuard)
  //@Roles('admin')
  //@ApiOperation({ summary: 'Toggle pin status (Admin only)' })
  //togglePin(@Param('id', ParseUUIDPipe) id: string) {
  //  return this.communityService.togglePin(id);
  //}

  //@Put('posts/:id/lock')
  //@UseGuards(RolesGuard)
  //@Roles('admin')
  //@ApiOperation({ summary: 'Toggle lock status (Admin only)' })
  //toggleLock(@Param('id', ParseUUIDPipe) id: string) {
  //  return this.communityService.toggleLock(id);
  //}

  //@Put('posts/:id/moderate')
  //@UseGuards(RolesGuard)
  //@Roles('admin')
  //@ApiOperation({ summary: 'Moderate a post (Admin only)' })
  //moderatePost(
  //  @Param('id', ParseUUIDPipe) id: string,
  //  @Body('status') status: PostStatus
  //) {
  //  return this.communityService.moderatePost(id, status);
  //}
}