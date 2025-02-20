import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, Length, IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content', minLength: 1, maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for nested comments' })
  @IsUUID()
  @IsOptional()
  parentCommentId?: string;
}