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

  private async updateEatenStatus(
    manager: any,
    type: 'meal' | 'food',
    id: string,
    eaten: boolean,
    user: User
  ): Promise<boolean> {
    try {
      const now = eaten ? new Date() : null;

      if (type === 'meal') {
        const meal = await this.getMealById(id, user);
        
        await manager.createQueryBuilder()
          .update(MealFood)
          .set({ eaten, eatenAt: now })
          .where('mealId = :mealId', { mealId: id })
          .execute();

        await manager.createQueryBuilder()
          .update(Meal)
          .set({ eaten, eatenAt: now })
          .where('id = :id', { id })
          .execute();

      } else { // food
        const mealFood = await this.getMealFoodById(id, user);
        
        // Update food status
        await manager.createQueryBuilder()
          .update(MealFood)
          .set({ eaten, eatenAt: now })
          .where('id = :id', { id })
          .execute();

        // Check if all foods in meal are eaten
        const allMealFoods = await this.mealFoodRepository.find({
          where: { meal: { id: mealFood.meal.id } }
        });

        const allEaten = allMealFoods.every(mf => mf.eaten);
        
        if (allEaten !== mealFood.meal.eaten) {
          await manager.update(Meal, mealFood.meal.id, {
            eaten: allEaten,
            eatenAt: allEaten ? new Date() : null
          });
        }
      }

      return true;
    } catch (error) {
      console.error(`Error updating ${type} eaten status:`, error);
      return false;
    }
  }

  async markMealAsEaten(mealId: string, eaten: boolean, user: User): Promise<boolean> {
    return await this.dataSource.transaction(manager => 
      this.updateEatenStatus(manager, 'meal', mealId, eaten, user)
    );
  }

  async markFoodAsEaten(foodId: string, eaten: boolean, user: User): Promise<boolean> {
    return await this.dataSource.transaction(manager => 
      this.updateEatenStatus(manager, 'food', foodId, eaten, user)
    );
  }

  async toggleFoodEaten(mealId: string, foodId: string, user: User): Promise<boolean> {
    try {
      return await this.dataSource.transaction(async manager => {
        // Get current status
        const mealFood = await this.getMealFoodByIds(mealId, foodId, user);
        
        if (!mealFood) {
          throw new HttpException('Food not found in this meal', HttpStatus.NOT_FOUND);
        }

        // Toggle the status
        mealFood.eaten = !mealFood.eaten;
        mealFood.eatenAt = mealFood.eaten ? new Date() : null;
        
        await manager.save(mealFood);

        const allMealFoods = await this.mealFoodRepository.find({
          where: { meal: { id: mealId } }
        });

        const allEaten = allMealFoods.every(mf => mf.eaten);
        
        if (allEaten !== mealFood.meal.eaten) {
          await manager.update(Meal, mealId, {
            eaten: allEaten,
            eatenAt: allEaten ? new Date() : null
          });
        }
        
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
        
        if (!meal) {
          throw new HttpException('Meal not found', HttpStatus.NOT_FOUND);
        }

        // Toggle the status
        meal.eaten = !meal.eaten;
        meal.eatenAt = meal.eaten ? new Date() : null;

        // Update all meal foods to match meal status
        if (meal.mealFoods) {
          await manager.createQueryBuilder()
            .update(MealFood)
            .set({ 
              eaten: meal.eaten,
              eatenAt: meal.eatenAt 
            })
            .where('mealId = :mealId', { mealId })
            .execute();
        }

        await manager.save(meal);
        
        return meal.eaten;
      });
    } catch (error) {
      console.error('Error toggling meal eaten status:', error);
      throw new HttpException('Failed to toggle meal status', HttpStatus.INTERNAL_SERVER_ERROR);
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

  async removeFoodFromMeal(mealId: string, foodId: string, user: User): Promise<void> {
    const mealFood = await this.mealFoodRepository.findOne({
      where: { 
        meal: { 
          id: mealId,
          mealPlan: { user: { id: user.id } }
        },
        food: { id: foodId }
      },
      relations: ['meal', 'food', 'meal.mealPlan']
    });

    if (!mealFood) {
      throw new HttpException('Food not found in this meal', HttpStatus.NOT_FOUND);
    }

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

  async getMealsByDate(date: Date, user: User): Promise<Meal[]> {

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Searching for meals between:', startOfDay, 'and', endOfDay);

    const meals = await this.mealRepository
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.mealPlan', 'mealPlan')
      .leftJoinAndSelect('meal.mealFoods', 'mealFoods')
      .leftJoinAndSelect('mealFoods.food', 'food')
      .where('mealPlan.user = :userId', { userId: user.id })
      .andWhere('mealPlan.startDate <= :endOfDay', { endOfDay })
      .andWhere('(mealPlan.endDate IS NULL OR mealPlan.endDate >= :startOfDay)', { startOfDay })
      .orderBy('meal.targetTime', 'ASC')
      .getMany();

    console.log(`Found ${meals.length} meals for date ${date}`);
    return meals;
  }

  async getMealFoodByIds(mealId: string, foodId: string, user: User): Promise<MealFood> {
    const mealFood = await this.mealFoodRepository.findOne({
      where: { 
        meal: { 
          id: mealId,
          mealPlan: { user: { id: user.id } }
        },
        food: { id: foodId }
      },
      relations: ['meal', 'food', 'meal.mealPlan']
    });

    if (!mealFood) {
      throw new HttpException('Food not found in this meal', HttpStatus.NOT_FOUND);
    }

    return mealFood;
  }
}