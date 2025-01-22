import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsUUID()
  @IsOptional()
  parentCommentId?: string;
}
