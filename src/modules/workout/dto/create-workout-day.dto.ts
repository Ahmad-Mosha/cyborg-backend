import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateWorkoutExerciseDto } from './create-workout-exercise.dto';

export class CreateWorkoutDayDto {
  @ApiProperty({
    description: 'Name of the workout day',
    example: 'Push Day',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the workout day',
    example: 'Focus on chest, shoulders, and triceps',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Order of this day in the workout plan (1-based)',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  dayOrder: number;

  @ApiProperty({
    description: 'Array of exercises for this workout day',
    type: [CreateWorkoutExerciseDto],
    example: [
      {
        exerciseId: '0001',
        exerciseOrder: 1,
        notes: 'Start with a light warm-up set',
        sets: [
          {
            setOrder: 1,
            reps: 12,
            weight: 50,
            notes: 'Warm-up set',
          },
        ],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutExerciseDto)
  exercises: CreateWorkoutExerciseDto[];
}
