import { IsString, IsArray, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomExerciseDto {
  @ApiProperty({ example: 'Custom Pushup' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'chest' })
  @IsString()
  bodyPart: string;

  @ApiProperty({ example: 'body weight' })
  @IsString()
  equipment: string;

  @ApiProperty({ example: 'https://example.com/exercise.gif' })
  @IsUrl()
  @IsOptional()
  gifUrl?: string;

  @ApiProperty({ example: 'chest' })
  @IsString()
  target: string;

  @ApiProperty({ example: ['triceps', 'shoulders'] })
  @IsArray()
  @IsString({ each: true })
  secondaryMuscles: string[];

  @ApiProperty({
    example: ['Get into plank position', 'Lower your body', 'Push back up'],
  })
  @IsArray()
  @IsString({ each: true })
  instructions: string[];
}
