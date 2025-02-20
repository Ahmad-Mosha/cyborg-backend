import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, Length, IsNotEmpty } from 'class-validator';
import { PostType } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ description: 'Post title', minLength: 3, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;

  @ApiProperty({ description: 'Post content', minLength: 10 })
  @IsString()
  @IsNotEmpty()
  @Length(10, 5000)
  content: string;

  @ApiPropertyOptional({ enum: PostType, default: PostType.GENERAL })
  @IsEnum(PostType)
  @IsOptional()
  type?: PostType = PostType.GENERAL;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[] = [];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  attachments?: string[] = [];
}