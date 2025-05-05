import { IsString, IsNotEmpty, IsOptional, IsDate, IsInt, Min, ValidateNested, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Create a class for validation instead of using interface
export class MealCalorieDistributionDto {
  @ApiProperty({
    description: 'Name of the meal',
    example: 'Breakfast'
  })
  @IsString()
  @IsNotEmpty()
  mealName: string;

  @ApiProperty({
    description: 'Percentage of daily calories',
    example: 25,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  percentage: number;

  @ApiProperty({
    description: 'Calculated calorie amount',
    example: 500,
    required: false
  })
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
  targetCalories?: number;

  @ApiProperty({
    description: 'Start date of the plan',
    required: false,
    type: Date,
    example: '2024-03-10'
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

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
    type: [MealCalorieDistributionDto],
    example: [
      { mealName: 'Breakfast', percentage: 25 },
      { mealName: 'Lunch', percentage: 40 },
      { mealName: 'Dinner', percentage: 35 }
    ]
  })
  @ValidateNested({ each: true })
  @Type(() => MealCalorieDistributionDto)
  @IsArray()
  @IsOptional()
  calorieDistribution?: MealCalorieDistributionDto[];
}
