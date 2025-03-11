import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionController } from './nutrition.controller';
import { MealPlanService } from './services/meal-plan.service';
import { MealService } from './services/meal.service';
import { NutritionCalculatorService } from './services/nutrition-calculator.service';
import { MealPlan } from './entities/meal-plan.entity';
import { Meal } from './entities/meal.entity';
import { MealFood } from './entities/meal-food.entity';
import { FoodModule } from '../food/food.module';
import { Food } from '../food/entities/food.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MealPlan, 
      Meal, 
      MealFood,
      Food
    ]),
    FoodModule,
  ],
  controllers: [NutritionController],
  providers: [
    MealPlanService,
    MealService,
    NutritionCalculatorService,
  ],
  exports: [
    MealPlanService,
    MealService,
    NutritionCalculatorService,
  ],
})
export class NutritionModule {}