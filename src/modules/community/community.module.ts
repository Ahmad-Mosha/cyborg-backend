import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Comment, Like])],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
