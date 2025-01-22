import { IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateExerciseSetDto {
  @IsNumber()
  setNumber: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reps?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  duration?: number;

  @IsBoolean()
  @IsOptional()
  isWarmupSet?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  rpe?: number;
}
