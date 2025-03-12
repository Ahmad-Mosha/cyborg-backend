import { IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StartWorkoutSessionDto {
  @ApiProperty({
    description: 'ID of the workout plan to use in this session',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiProperty({
    description: 'ID of the workout day from the plan to use in this session',
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  dayId?: string;

  @ApiProperty({
    description: 'Custom name for this workout session',
    example: 'Monday Push Session',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Additional notes for this workout session',
    example: 'Feeling good today!',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'When the workout session started',
    example: '2023-08-10T14:00:00.000Z',
    required: false,
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startTime?: Date;
}
