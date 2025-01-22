import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class CreateRoutineDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedDuration?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  difficulty?: number;
}
