import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'The name of the workout routine',
    example: 'Full Body Workout',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'A detailed description of the workout routine',
    example:
      'A comprehensive full body workout targeting all major muscle groups',
    required: false,
  })
  description?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Whether the routine is visible to other users',
    example: true,
    required: false,
    default: false,
  })
  isPublic?: boolean;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'Tags to categorize the workout routine',
    example: ['strength', 'cardio', 'beginner'],
    required: false,
    type: [String],
  })
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: 'Estimated duration of the workout in minutes',
    example: 45,
    required: false,
    minimum: 0,
  })
  estimatedDuration?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description: 'Difficulty level of the workout routine',
    example: 3,
    required: false,
    minimum: 1,
    maximum: 5,
  })
  difficulty?: number;
}
