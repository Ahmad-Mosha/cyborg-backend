import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @IsString()
  @ApiProperty({
    description: 'The ID of the workout routine this session belongs to',
    example: 'e87ef3f1-1f2a-4b6f-b381-4ea3c40b6d3a',
  })
  routineId: string;

  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    description: 'The start time of the workout session',
    example: '2023-01-01T10:00:00Z',
  })
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @ApiProperty({
    description: 'The end time of the workout session',
    example: '2023-01-01T11:00:00Z',
    required: false,
  })
  endTime?: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Additional notes about the workout session',
    example: 'Felt strong today, increased weights on all exercises',
    required: false,
  })
  notes?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: "User's weight recorded for this session (in kg)",
    example: 75.5,
    required: false,
  })
  userWeight?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description: "User's mood rating for the session",
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  mood?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  @ApiProperty({
    description: "User's energy level rating for the session",
    example: 3,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  energyLevel?: number;
}
