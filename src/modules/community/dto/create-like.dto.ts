import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

export enum LikeTargetType {
  POST = 'post',
  COMMENT = 'comment'
}

export class CreateLikeDto {
  @ApiProperty({ enum: LikeTargetType })
  @IsEnum(LikeTargetType)
  targetType: LikeTargetType;

  @ApiProperty({ description: 'ID of the target (post or comment)' })
  @IsUUID()
  targetId: string;
}