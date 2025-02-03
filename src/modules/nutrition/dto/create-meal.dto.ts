import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDate,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type as TransformType } from 'class-transformer';
import { MealType } from '../entities/meal.entity';

export class AddFoodToMealDto {
  @IsString()
  @ApiProperty({
    description: 'The ID of the food item to add to the meal',
    example: 'e87ef3f1-1f2a-4b6f-b381-4ea3c40b6d3a',
  })
  foodId: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'The amount of food in the specified serving unit',
    example: 100,
    minimum: 0,
  })
  servingSize: number;

  @IsString()
  @ApiProperty({
    description: 'The unit of measurement for the serving size',
    example: 'grams',
  })
  servingUnit: string;
}

export class CreateMealDto {
  @IsString()
  @ApiProperty({
    description: 'The name of the meal',
    example: 'Breakfast',
  })
  name: string;

  @IsEnum(MealType)
  @ApiProperty({
    description: 'The type of meal',
    enum: MealType,
    example: 'BREAKFAST',
  })
  type: MealType;

  @IsDate()
  @TransformType(() => Date)
  @ApiProperty({
    description: 'The date and time when the meal was consumed',
    example: '2023-01-01T08:00:00Z',
  })
  consumedAt: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Additional notes about the meal',
    example: 'High protein breakfast after morning workout',
    required: false,
  })
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @TransformType(() => AddFoodToMealDto)
  @ApiProperty({
    description: 'Array of food items included in the meal',
    type: [AddFoodToMealDto],
  })
  foods: AddFoodToMealDto[];
}
