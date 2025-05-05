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
import { UpdateMealDto } from '../dto/update-meal.dto';

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

  async addMealToMealPlan(
    mealPlanId: string,
    dto: AddMealDto,
    user: User,
  ): Promise<Meal> {
    return await this.dataSource.transaction(async (manager) => {
      const mealPlan = await this.mealPlanService.getMealPlanById(
        mealPlanId,
        user,
      );

      // Handle time string conversion for targetTime
      let timeDate;
      if (dto.targetTime) {
        const [hours, minutes] = dto.targetTime.split(':').map(Number);
        timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
      } else {
        // Default time if not provided
        timeDate = new Date();
        timeDate.setHours(12, 0, 0, 0); // Default to noon
      }

      const meal = manager.create(Meal, {
        name: dto.name,
        targetTime: timeDate,
        targetCalories: dto.targetCalories,
        nutritionGoals: dto.nutritionGoals,
        mealPlan: { id: mealPlan.id },
      });

      return await manager.save(meal);
    });
  }

  // Updated to handle eaten status at meal level only
  async toggleMealEaten(mealId: string, user: User): Promise<boolean> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // Get current status
        const meal = await this.getMealById(mealId, user);

        if (!meal) {
          throw new HttpException('Meal not found', HttpStatus.NOT_FOUND);
        }

        // Toggle the status
        meal.eaten = !meal.eaten;
        meal.eatenAt = meal.eaten ? new Date() : null;

        await manager.save(meal);

        return meal.eaten;
      });
    } catch (error) {
      console.error('Error toggling meal eaten status:', error);
      throw new HttpException(
        'Failed to toggle meal status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async markMealAsEaten(
    mealId: string,
    eaten: boolean,
    user: User,
  ): Promise<boolean> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const meal = await this.getMealById(mealId, user);

        if (!meal) {
          throw new HttpException('Meal not found', HttpStatus.NOT_FOUND);
        }

        meal.eaten = eaten;
        meal.eatenAt = eaten ? new Date() : null;

        await manager.save(meal);
        return meal.eaten;
      });
    } catch (error) {
      console.error('Error marking meal as eaten:', error);
      throw new HttpException(
        'Failed to update meal status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMealById(mealId: string, user: User): Promise<Meal> {
    const meal = await this.mealRepository.findOne({
      where: {
        id: mealId,
        mealPlan: { user: { id: user.id } },
      },
      relations: ['mealFoods', 'mealFoods.food'],
    });

    if (!meal) {
      throw new HttpException('Meal not found', HttpStatus.NOT_FOUND);
    }

    return meal;
  }

  // Enhanced food addition with simplified approach
  async addFoodToMeal(
    mealId: string,
    dto: AddFoodToMealDto,
    user: User,
  ): Promise<MealFood> {
    return await this.dataSource.transaction(async (manager) => {
      const meal = await this.getMealById(mealId, user);

      let food;

      // Case 1: Using an existing food by ID
      if (dto.foodId) {
        food = await this.foodRepository.findOne({ where: { id: dto.foodId } });
        if (!food) {
          throw new HttpException(
            `Food with ID ${dto.foodId} not found`,
            HttpStatus.NOT_FOUND,
          );
        }
      }
      // Case 2: Using a USDA food by ID
      else if (dto.usdaFoodId) {
        food = await this.foodRepository.findOne({
          where: { usdaId: dto.usdaFoodId },
        });

        if (!food) {
          // If not found locally, fetch from USDA API
          const foodData = await this.foodService.getFoodDetails(
            dto.usdaFoodId,
          );
          food = manager.create(Food, {
            ...foodData,
            user: { id: user.id },
          });
          food = await manager.save(food);
        }
      }
      // Case 3: Creating a one-time custom food
      else if (dto.customFood) {
        // Create a temporary food entity (not saved to database unless specified)
        food = manager.create(Food, {
          name: dto.customFood.name,
          calories: dto.customFood.calories,
          protein: dto.customFood.protein || 0,
          carbohydrates: dto.customFood.carbohydrates || 0,
          fat: dto.customFood.fat || 0,
          servingSize: dto.servingSize || 100,
          servingUnit: dto.servingUnit || 'g',
          isCustom: true,
        });

        // If user wants to save this custom food to their collection
        if (dto.saveToCollection) {
          food.user = { id: user.id };
          food = await manager.save(food);
        }
      }
      // Case 4: Searching for a food
      else if (dto.query) {
        const searchResults = await this.foodService.searchFoods(
          dto.query,
          1,
          1,
        );
        if (searchResults.foods && searchResults.foods.length > 0) {
          const foodDetails = searchResults.foods[0];

          food = manager.create(Food, {
            ...foodDetails,
          });

          // Don't save to the foods table - this is just for the meal
        } else {
          throw new HttpException(
            `No food found matching query: ${dto.query}`,
            HttpStatus.NOT_FOUND,
          );
        }
      } else {
        throw new HttpException(
          'You must provide either foodId, usdaFoodId, customFood details, or query',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calculate nutrients based on serving size - compute on demand instead of storing static values
      const servingSize = dto.servingSize || 100;
      const nutrients = this.nutritionCalculator.calculateNutrients(
        food,
        servingSize,
      );

      // Create and save the meal food with calculated nutrients
      const mealFood = manager.create(MealFood, {
        meal: { id: meal.id },
        food: food.id ? { id: food.id } : food, // Use reference if food has ID, otherwise embed
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
          cholesterol: nutrients.cholesterol || 0,
        },
      });

      return await manager.save(mealFood);
    });
  }

  // Add method for recalculating nutrients for meal foods
  async recalculateMealNutrition(meal: Meal): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      if (!meal.mealFoods || meal.mealFoods.length === 0) {
        return;
      }

      for (const mealFood of meal.mealFoods) {
        // Re-fetch the food to ensure we have the latest nutrition data
        const food = await this.foodRepository.findOne({
          where: { id: mealFood.food.id },
        });

        if (food) {
          // Recalculate nutrients with current food data
          const nutrients = this.nutritionCalculator.calculateNutrients(
            food,
            mealFood.servingSize,
          );

          // Update the meal food with fresh nutrient values
          mealFood.nutrients = {
            calories: nutrients.calories || 0,
            protein: nutrients.protein || 0,
            carbohydrates: nutrients.carbohydrates || 0,
            fat: nutrients.fat || 0,
            fiber: nutrients.fiber || 0,
            sugar: nutrients.sugar || 0,
            sodium: nutrients.sodium || 0,
            cholesterol: nutrients.cholesterol || 0,
          };

          await manager.save(mealFood);
        }
      }
    });
  }

  async updateMealFood(
    id: string,
    dto: UpdateMealFoodDto,
    user: User,
  ): Promise<MealFood> {
    return await this.dataSource.transaction(async (manager) => {
      const mealFood = await this.getMealFoodById(id, user);

      if (dto.servingSize) {
        // Get fresh food data and recalculate nutrients
        const food = await this.foodRepository.findOne({
          where: { id: mealFood.food.id },
        });

        if (food) {
          const nutrients = this.nutritionCalculator.calculateNutrients(
            food,
            dto.servingSize,
          );
          mealFood.nutrients = nutrients;
        }
      }

      // Update other properties
      if (dto.servingSize) mealFood.servingSize = dto.servingSize;
      if (dto.servingUnit) mealFood.servingUnit = dto.servingUnit;

      return await manager.save(mealFood);
    });
  }

  async removeFoodFromMeal(
    mealId: string,
    foodId: string,
    user: User,
  ): Promise<void> {
    const mealFood = await this.mealFoodRepository.findOne({
      where: {
        meal: {
          id: mealId,
          mealPlan: { user: { id: user.id } },
        },
        food: { id: foodId },
      },
      relations: ['meal', 'food', 'meal.mealPlan'],
    });

    if (!mealFood) {
      throw new HttpException(
        'Food not found in this meal',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.mealFoodRepository.remove(mealFood);
  }

  async getMealFoodById(id: string, user: User): Promise<MealFood> {
    const mealFood = await this.mealFoodRepository.findOne({
      where: {
        id,
        meal: { mealPlan: { user: { id: user.id } } },
      },
      relations: ['meal', 'food', 'meal.mealPlan'],
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

    const meals = await this.mealRepository
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.mealPlan', 'mealPlan')
      .leftJoinAndSelect('meal.mealFoods', 'mealFoods')
      .leftJoinAndSelect('mealFoods.food', 'food')
      .where('mealPlan.user = :userId', { userId: user.id })
      .andWhere('mealPlan.startDate <= :endOfDay', { endOfDay })
      .andWhere(
        '(mealPlan.endDate IS NULL OR mealPlan.endDate >= :startOfDay)',
        { startOfDay },
      )
      .orderBy('meal.targetTime', 'ASC')
      .getMany();

    // Ensure fresh nutrition data
    for (const meal of meals) {
      await this.recalculateMealNutrition(meal);
    }

    return meals;
  }

  async getMealFoodByIds(
    mealId: string,
    foodId: string,
    user: User,
  ): Promise<MealFood> {
    const mealFood = await this.mealFoodRepository.findOne({
      where: {
        meal: {
          id: mealId,
          mealPlan: { user: { id: user.id } },
        },
        food: { id: foodId },
      },
      relations: ['meal', 'food', 'meal.mealPlan'],
    });

    if (!mealFood) {
      throw new HttpException(
        'Food not found in this meal',
        HttpStatus.NOT_FOUND,
      );
    }

    return mealFood;
  }

  async updateMeal(
    id: string,
    updateMealDto: UpdateMealDto,
    user: User,
  ): Promise<Meal> {
    const meal = await this.getMealById(id, user);

    if (!meal) {
      throw new HttpException('Meal not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Handle time string conversion for targetTime
      if (updateMealDto.targetTime) {
        const [hours, minutes] = updateMealDto.targetTime
          .split(':')
          .map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        updateMealDto.targetTime = timeDate as any;
      }

      // Update the meal with the provided fields
      const updatedMeal = await this.mealRepository.save({
        ...meal,
        ...updateMealDto,
        id: meal.id, // Ensure we keep the same ID
      });

      return this.getMealById(updatedMeal.id, user);
    } catch (error) {
      console.error('Error updating meal:', error);
      throw new HttpException(
        'Failed to update meal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteMeal(id: string, user: User): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const meal = await this.getMealById(id, user);

      if (!meal) {
        throw new HttpException('Meal not found', HttpStatus.NOT_FOUND);
      }

      // First remove any associated meal foods
      if (meal.mealFoods && meal.mealFoods.length > 0) {
        await manager.remove(meal.mealFoods);
      }

      try {
        // Remove the meal
        await manager.remove(meal);
      } catch (error) {
        console.error('Error deleting meal:', error);
        throw new HttpException(
          'Failed to delete meal',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  }

  // New method to create daily instances of meals in a meal plan
  async createDailyMealsFromTemplate(
    mealPlanId: string,
    date: Date,
    user: User,
  ): Promise<Meal[]> {
    return await this.dataSource.transaction(async (manager) => {
      const mealPlan = await this.mealPlanService.getMealPlanById(
        mealPlanId,
        user,
      );

      // Find the template meals for this plan
      const templateMeals = await this.mealRepository.find({
        where: { mealPlan: { id: mealPlan.id } },
        relations: ['mealFoods', 'mealFoods.food'],
      });

      if (!templateMeals || templateMeals.length === 0) {
        return [];
      }

      const targetDay = new Date(date);
      targetDay.setHours(0, 0, 0, 0);

      // Check if meals already exist for this date
      const existingMeals = await this.getMealsByDate(targetDay, user);
      if (existingMeals.length > 0) {
        return existingMeals; // Don't create duplicates
      }

      const newMeals: Meal[] = [];

      // Create a copy of each template meal for the target date
      for (const template of templateMeals) {
        // Create new meal
        const newMeal = manager.create(Meal, {
          name: template.name,
          targetCalories: template.targetCalories,
          nutritionGoals: template.nutritionGoals,
          targetTime: template.targetTime, // Keep same time
          mealPlan: { id: mealPlan.id },
          eaten: false,
          eatenAt: null,
        });

        const savedMeal = await manager.save(newMeal);

        // Copy foods
        if (template.mealFoods && template.mealFoods.length > 0) {
          for (const mealFood of template.mealFoods) {
            const newMealFood = manager.create(MealFood, {
              meal: { id: savedMeal.id },
              food: { id: mealFood.food.id },
              servingSize: mealFood.servingSize,
              servingUnit: mealFood.servingUnit,
              nutrients: { ...mealFood.nutrients },
            });

            await manager.save(newMealFood);
          }
        }

        newMeals.push(savedMeal);
      }

      return newMeals;
    });
  }
}
