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
  routineId: string;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endTime?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  userWeight?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  mood?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  energyLevel?: number;
}
