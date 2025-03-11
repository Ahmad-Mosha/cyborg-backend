import { IsString, IsNotEmpty, IsOptional, IsDate, IsInt, Min, ValidateNested, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Create a class for validation instead of using interface
export class MealCalorieDistributionDto {
  @IsString()
  mealName: string;

  @IsNumber()
  percentage: number;

  @IsNumber()
  @IsOptional()
  calorieAmount?: number;
}

export class CreateMealPlanDto {
  @ApiProperty({
    description: 'Name of the meal plan',
    example: 'Ramadan Plan'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the plan',
    required: false,
    example: 'Balanced diet plan for Ramadan'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Daily target calories',
    required: false,
    default: 2000,
    example: 2000
  })
  @IsNumber()
  @IsOptional()
  targetCalories?: number = 2000;

  @ApiProperty({
    description: 'Start date of the plan',
    required: false,
    type: Date,
    example: '2024-03-10'
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date = new Date();

  @ApiProperty({
    description: 'End date of the plan',
    required: false,
    type: Date,
    example: '2024-04-10'
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    description: 'Custom calorie distribution for meals',
    required: false,
    type: [MealCalorieDistributionDto]
  })
  @ValidateNested({ each: true })
  @Type(() => MealCalorieDistributionDto)
  @IsOptional()
  calorieDistribution?: MealCalorieDistributionDto[] = [
    { mealName: 'Breakfast', percentage: 25 },
    { mealName: 'Lunch', percentage: 40 },
    { mealName: 'Dinner', percentage: 35 }
  ];
}
