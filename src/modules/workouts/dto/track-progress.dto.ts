import { IsString, IsNumber, IsDate, IsOptional, Min } from 'class-validator';

export class TrackProgressDto {
  @IsString()
  workoutId: string;

  @IsNumber()
  @Min(0)
  duration: number;

  @IsNumber()
  @Min(0)
  caloriesBurned: number;

  @IsDate()
  completedAt: Date;

  @IsNumber()
  @IsOptional()
  @Min(1)
  intensity?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  distance?: number;
}
