import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class CreateFoodDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  servingSize: number;

  @IsString()
  servingUnit: string;

  @IsNumber()
  @Min(0)
  calories: number;

  @IsNumber()
  @Min(0)
  protein: number;

  @IsNumber()
  @Min(0)
  carbs: number;

  @IsNumber()
  @Min(0)
  fat: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fiber?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sugar?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sodium?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
