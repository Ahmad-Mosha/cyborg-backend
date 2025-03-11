import { PartialType } from '@nestjs/mapped-types';
import { CreateMealFoodDto } from './create-meal-food.dto';

export class UpdateMealFoodDto extends PartialType(CreateMealFoodDto) {}