import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddWorkoutExerciseDto {
  @ApiProperty({
    description: 'ID of the exercise to add',
    example: '0003',
    type: String,
  })
  @IsString()
  exerciseId: string;

  @ApiProperty({
    description: 'Order of this exercise in the workout day (1-based)',
    example: 3,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  exerciseOrder: number;

  @ApiProperty({
    description: 'Additional notes for this exercise',
    example: 'Focus on proper form, slow on the eccentric phase',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
