import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SetType } from '../entities/exercise-set.entity';

export class CreateExerciseSetDto {
  @ApiProperty({
    description: 'Rest time in seconds after this set',
    example: 120,
    minimum: 0,
    default: 120,
    required: false,
    type: Number,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  restTimeSeconds?: number;

  @ApiProperty({
    description: 'Number of repetitions to perform',
    example: 12,
    minimum: 0,
    type: Number,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  reps?: number;

  @ApiProperty({
    description:
      'Weight to use for this set (in kg/lbs depending on user preference)',
    example: 50,
    minimum: 0,
    type: Number,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @ApiProperty({
    description: 'Additional notes for this set',
    example: 'Warm-up set',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Type of set',
    enum: SetType,
    example: SetType.NORMAL,
    default: SetType.NORMAL,
  })
  @IsEnum(SetType)
  @IsOptional()
  type?: SetType;
}
