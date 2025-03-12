import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanType } from '../entities/workout-plan.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CreateWorkoutDayDto } from './create-workout-day.dto';

export class CreateWorkoutPlanDto {
  @ApiProperty({
    description: 'The name of the workout plan',
    example: '4-Day Split',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the workout plan',
    example: 'My custom workout plan focusing on strength gains',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of workout plan',
    enum: PlanType,
    example: 'custom',
    required: false,
    default: 'custom',
  })
  @IsEnum(PlanType)
  @IsOptional()
  type?: PlanType;

  @ApiProperty({
    description: 'Array of workout days',
    type: [CreateWorkoutDayDto],
    example: [
      {
        name: 'Chest and Triceps',
        description: 'Push day focusing on chest and triceps',
        dayOrder: 1,
        exercises: [
          {
            exerciseId: '0001',
            exerciseOrder: 1,
            notes: 'Warm up with light weight first',
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
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutDayDto)
  days: CreateWorkoutDayDto[];
}
