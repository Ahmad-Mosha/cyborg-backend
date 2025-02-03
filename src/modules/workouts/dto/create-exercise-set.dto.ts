import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateExerciseSetDto {
  @IsNumber()
  @ApiProperty({
    description: 'The sequence number of this set in the exercise',
    example: 1,
  })
  setNumber: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: 'The weight used for this set in kilograms',
    example: 60.5,
    required: false,
    minimum: 0,
  })
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: 'Number of repetitions performed in this set',
    example: 12,
    required: false,
    minimum: 0,
  })
  reps?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: 'Duration of the set in seconds (for timed exercises)',
    example: 60,
    required: false,
    minimum: 0,
  })
  duration?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Indicates if this is a warm-up set',
    example: false,
    required: false,
  })
  isWarmupSet?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  @ApiProperty({
    description: 'Rate of Perceived Exertion (RPE) for this set',
    example: 8,
    required: false,
    minimum: 1,
    maximum: 10,
  })
  rpe?: number;
}
