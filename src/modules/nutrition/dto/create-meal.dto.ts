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
  foodId: string;

  @IsNumber()
  @Min(0)
  servingSize: number;

  @IsString()
  servingUnit: string;
}

export class CreateMealDto {
  @IsString()
  name: string;

  @IsEnum(MealType)
  type: MealType;

  @IsDate()
  @TransformType(() => Date)
  consumedAt: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @TransformType(() => AddFoodToMealDto)
  foods: AddFoodToMealDto[];
}
