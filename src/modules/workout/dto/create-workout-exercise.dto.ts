import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateExerciseSetDto } from './create-exercise-set.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkoutExerciseDto {
  @ApiProperty({
    description: 'ID of the exercise to add to the workout',
    example: '0001',
    type: String,
  })
  @IsString()
  exerciseId: string;

  @ApiProperty({
    description: 'Order of this exercise in the workout day (1-based)',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  exerciseOrder: number;

  @ApiProperty({
    description: 'Additional notes for this exercise',
    example: 'Focus on form and controlled descent',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Array of sets for this exercise',
    type: [CreateExerciseSetDto],
    required: false,
    example: [
      {
        setOrder: 1,
        reps: 12,
        weight: 50,
        notes: 'Warm-up set',
        type: 'warm_up',
      },
      {
        setOrder: 2,
        reps: 10,
        weight: 60,
        type: 'normal',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseSetDto)
  @IsOptional()
  sets?: CreateExerciseSetDto[];
}
