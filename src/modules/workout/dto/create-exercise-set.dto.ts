import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExerciseSetDto {
  @ApiProperty({
    description: 'Order of this set in the exercise (1-based)',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  setOrder: number;

  @ApiProperty({
    description: 'Number of repetitions to perform',
    example: 12,
    minimum: 0,
    type: Number,
  })
  @IsInt()
  @Min(0)
  reps: number;

  @ApiProperty({
    description:
      'Weight to use for this set (in kg/lbs depending on user preference)',
    example: 50,
    minimum: 0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({
    description: 'Additional notes for this set',
    example: 'Warm-up set',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
