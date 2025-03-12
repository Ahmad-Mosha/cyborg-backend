import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Meal } from '../entities/meal.entity';
import { MealFood } from '../entities/meal-food.entity';
import { User } from '../../users/entities/user.entity';
import { AddMealDto } from '../dto/add-meal.dto';
import { AddFoodToMealDto } from '../dto/add-food-to-meal.dto';
import { UpdateMealFoodDto } from '../dto/update-meal-food.dto';
import { FoodService } from '../../food/food.service';
import { MealPlanService } from './meal-plan.service';
import { NutritionCalculatorService } from './nutrition-calculator.service';
import { Food } from '../../food/entities/food.entity';
import { LessThanOrEqual, IsNull, MoreThanOrEqual, Between } from 'typeorm';

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
    @InjectRepository(MealFood)
    private readonly mealFoodRepository: Repository<MealFood>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    private readonly foodService: FoodService,
    private readonly mealPlanService: MealPlanService,
    private readonly nutritionCalculator: NutritionCalculatorService,
    private readonly dataSource: DataSource,
  ) {}

  async addMealToMealPlan(mealPlanId: string, dto: AddMealDto, user: User): Promise<Meal> {
    return await this.dataSource.transaction(async manager => {
      const mealPlan = await this.mealPlanService.getMealPlanById(mealPlanId, user);

      const meal = manager.create(Meal, {
        ...dto,
        mealPlan: { id: mealPlan.id },
      });

      return await manager.save(meal);
    });
  }

  async markMealAsEaten(mealId: string, eaten: boolean, user: User): Promise<boolean> {
    try {
      await this.dataSource.transaction(async manager => {
        const meal = await this.getMealById(mealId, user);
        const now = eaten ? new Date() : null;

        // Bulk update all meal foods
        await manager.createQueryBuilder()
          .update(MealFood)
          .set({ eaten, eatenAt: now })
          .where('mealId = :mealId', { mealId })
          .execute();

        // Update meal status
        await manager.createQueryBuilder()
          .update(Meal)
          .set({ eaten, eatenAt: now })
          .where('id = :id', { id: mealId })
          .execute();
      });

      return true;
    } catch (error) {
      console.error('Error marking meal as eaten:', error);
      return false;
    }
  }

  async getMealById(mealId: string, user: User): Promise<Meal> {
    const meal = await this.mealRepository.findOne({
      where: { 
        id: mealId,
        mealPlan: { user: { id: user.id } } 
      },
      relations: ['mealFoods', 'mealFoods.food'],
    });

    if (!meal) {
      throw new HttpException('Meal not found', HttpStatus.NOT_FOUND);
    }

    return meal;
  }

  async addFoodToMeal(mealId: string, dto: AddFoodToMealDto, user: User): Promise<MealFood> {
    return await this.dataSource.transaction(async manager => {
      const meal = await this.getMealById(mealId, user);
      
      let food;
      if (dto.foodId) {
        food = await this.foodRepository.findOne({ where: { id: dto.foodId } });
        if (!food) {
          throw new HttpException(`Food with ID ${dto.foodId} not found`, HttpStatus.NOT_FOUND);
        }
      } else if (dto.usdaFoodId) {
        food = await this.foodRepository.findOne({ where: { usdaId: dto.usdaFoodId } });
        if (!food) {
          // If not found locally, fetch from USDA API
          const foodData = await this.foodService.getFoodDetails(dto.usdaFoodId);
          food = manager.create(Food, foodData);
          food.user = { id: user.id };
          food = await manager.save(food);
        }
      } else if (dto.query) {
        const searchResults = await this.foodService.searchFoods(dto.query, 1, 1);
        if (searchResults.foods && searchResults.foods.length > 0) {
          const foodDetails = searchResults.foods[0];
          
          // Create new food entry with nutritional values
          food = manager.create(Food, {
            ...foodDetails,
            user: { id: user.id }
          });
          
          food = await manager.save(food);
          
          // Log the food data for debugging
          console.log('Created food with details:', JSON.stringify(food, null, 2));
        } else {
          throw new HttpException(`No food found matching query: ${dto.query}`, HttpStatus.NOT_FOUND);
        }
      } else {
        throw new HttpException('You must provide either foodId, usdaFoodId, or query', HttpStatus.BAD_REQUEST);
      }

      // Calculate nutrients based on serving size
      const servingSize = dto.servingSize || 100;
      const nutrients = this.nutritionCalculator.calculateNutrients(food, servingSize);
      
      // Create and save the meal food with calculated nutrients
      const mealFood = manager.create(MealFood, {
        meal: { id: meal.id },
        food: { id: food.id },
        servingSize: servingSize,
        servingUnit: dto.servingUnit || 'g',
        nutrients: {
          calories: nutrients.calories || 0,
          protein: nutrients.protein || 0,
          carbohydrates: nutrients.carbohydrates || 0,
          fat: nutrients.fat || 0,
          fiber: nutrients.fiber || 0,
          sugar: nutrients.sugar || 0,
          sodium: nutrients.sodium || 0,
          cholesterol: nutrients.cholesterol || 0
        },
        eaten: false
      });
      
      const savedMealFood = await manager.save(mealFood);
      
      
      //console.log('Saved MealFood:', JSON.stringify(savedMealFood, null, 2));
      
      return savedMealFood;
    });
  }

  async updateMealFood(id: string, dto: UpdateMealFoodDto, user: User): Promise<MealFood> {
    return await this.dataSource.transaction(async manager => {
      const mealFood = await this.getMealFoodById(id, user);
      
      if (dto.servingSize) {
        const nutrients = this.nutritionCalculator.calculateNutrients(mealFood.food, dto.servingSize);
        Object.assign(mealFood, { nutrients });
      }

      Object.assign(mealFood, dto);
      return await manager.save(mealFood);
    });
  }

  async removeFoodFromMeal(id: string, user: User): Promise<void> {
    const mealFood = await this.getMealFoodById(id, user);
    await this.mealFoodRepository.remove(mealFood);
  }

  async getMealFoodById(id: string, user: User): Promise<MealFood> {
    const mealFood = await this.mealFoodRepository.findOne({
      where: { 
        id,
        meal: { mealPlan: { user: { id: user.id } } }
      },
      relations: ['meal', 'food', 'meal.mealPlan']
    });

    if (!mealFood) {
      throw new HttpException('Meal food not found', HttpStatus.NOT_FOUND);
    }

    return mealFood;
  }

  async markFoodAsEaten(id: string, eaten: boolean, user: User): Promise<boolean> {
    try {
      await this.dataSource.transaction(async manager => {
        const mealFood = await this.getMealFoodById(id, user);
        
        // Update eaten status and timestamp
        const now = eaten ? new Date() : null;
        await manager.createQueryBuilder()
          .update(MealFood)
          .set({ eaten, eatenAt: now })
          .where('id = :id', { id })
          .execute();
      });

      return true;
    } catch (error) {
      console.error('Error marking food as eaten:', error);
      return false;
    }
  }

  async toggleFoodEaten(id: string, user: User): Promise<boolean> {
    try {
      return await this.dataSource.transaction(async manager => {
        // Get current status
        const mealFood = await this.getMealFoodById(id, user);
        
        // Toggle the status
        mealFood.eaten = !mealFood.eaten;
        mealFood.eatenAt = mealFood.eaten ? new Date() : null;
        
        // Save the changes
        await manager.save(mealFood);
        
        // Return the new status
        return mealFood.eaten;
      });
    } catch (error) {
      console.error('Error toggling food eaten status:', error);
      throw new HttpException('Failed to toggle food status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleMealEaten(mealId: string, user: User): Promise<boolean> {
    try {
      return await this.dataSource.transaction(async manager => {
        // Get current status
        const meal = await this.getMealById(mealId, user);
        
        // Toggle the status
        meal.eaten = !meal.eaten;
        meal.eatenAt = meal.eaten ? new Date() : null;

        // Update all meal foods
        if (meal.mealFoods) {
          for (const mealFood of meal.mealFoods) {
            mealFood.eaten = meal.eaten;
            mealFood.eatenAt = meal.eatenAt;
            await manager.save(mealFood);
          }
        }

        // Save meal changes
        await manager.save(meal);
        
        // Return the new status
        return meal.eaten;
      });
    } catch (error) {
      console.error('Error toggling meal eaten status:', error);
      throw new HttpException('Failed to toggle meal status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getMealsByDate(date: Date, user: User): Promise<Meal[]> {
    // Format date to match only the date part (YYYY-MM-DD)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const meals = await this.mealRepository.find({
      where: {
        mealPlan: { 
          user: { id: user.id },
          startDate: LessThanOrEqual(targetDate),
          endDate: IsNull() || MoreThanOrEqual(targetDate)
        }
      },
      relations: [
        'mealFoods',
        'mealFoods.food',
        'mealPlan'
      ],
      order: {
        targetTime: 'ASC'
      }
    });

    return meals;
  }
}