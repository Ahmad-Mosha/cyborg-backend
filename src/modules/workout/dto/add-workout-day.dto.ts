import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddWorkoutDayDto {
  @ApiProperty({
    description: 'Name of the workout day',
    example: 'Pull Day',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the workout day',
    example: 'Focus on back and biceps',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Order of this day in the workout plan (1-based)',
    example: 2,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  dayOrder: number;
}
