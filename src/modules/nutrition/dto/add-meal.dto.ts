import { IsString, IsNotEmpty, IsOptional, IsDate, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class NutritionGoalsDto {
  @ApiProperty({ example: 30 })
  @IsNumber()
  protein: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  carbs: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  fat: number;
}

export class AddMealDto {
  @ApiProperty({ example: 'breakfast' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Target time for the meal',
    example: '18:30',
    type: String 
  })
  @IsString()
  targetTime: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsOptional()
  targetCalories?: number;

  @ApiProperty({ type: NutritionGoalsDto })
  @ValidateNested()
  @Type(() => NutritionGoalsDto)
  @IsOptional()
  nutritionGoals?: NutritionGoalsDto;
}