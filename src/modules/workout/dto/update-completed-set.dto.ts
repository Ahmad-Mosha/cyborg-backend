import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompletedSetDto {
  @ApiProperty({
    description: 'Number of repetitions performed',
    example: 10,
    required: false,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reps?: number;

  @ApiProperty({
    description:
      'Weight used for this set (in kg/lbs depending on user preference)',
    example: 75,
    required: false,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @ApiProperty({
    description: 'Whether the set has been completed',
    example: true,
    required: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiProperty({
    description: 'Additional notes about this set',
    example: 'Felt stronger than expected',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
