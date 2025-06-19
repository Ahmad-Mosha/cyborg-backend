import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Meal } from '../entities/meal.entity';
import { MealFood } from '../entities/meal-food.entity';
import { MealPlan } from '../entities/meal-plan.entity';
import { Food } from '../../food/entities/food.entity';
import { User } from '../../users/entities/user.entity';
import { AddMealDto } from '../dto/add-meal.dto';
import { UpdateMealDto } from '../dto/update-meal.dto';
import { AddFoodToMealDto } from '../dto/add-food-to-meal.dto';
import { SearchAndAddFoodDto } from '../dto/search-and-add-food.dto';
import { AddCustomFoodDto } from '../dto/add-custom-food.dto';
import { FoodService } from '../../food/food.service';
import { NutritionCalculatorService } from './nutrition-calculator.service';
import { MealPlanService } from './meal-plan.service';
import { startOfDay, endOfDay } from 'date-fns';

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
    const meal = await this.dataSource.transaction(async (manager) => {
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

    // Synchronize calorie distribution with meals
    await this.mealPlanService.synchronizeCalorieDistribution(mealPlanId, user);

    return meal;
  }

  // Updated to handle eaten status at meal level only
  async toggleMealEaten(mealId: string, user: User): Promise<boolean> {
    const meal = await this.getMealById(mealId, user);

    const isEaten = !meal.eaten;
    const eatenAt = isEaten ? new Date() : null;

    await this.mealRepository.update(
      { id: mealId },
      { eaten: isEaten, eatenAt },
    );

    return isEaten;
  }

  async markMealAsEaten(
    mealId: string,
    eaten: boolean,
    user: User,
  ): Promise<boolean> {
    const meal = await this.getMealById(mealId, user);

    const eatenAt = eaten ? new Date() : null;

    await this.mealRepository.update({ id: mealId }, { eaten, eatenAt });

    // No need to update foods separately, as we're tracking eaten status at meal level

    return eaten;
  }

  async getMealById(id: string, user: User): Promise<Meal> {
    const meal = await this.mealRepository.findOne({
      where: {
        id,
        mealPlan: { user: { id: user.id } },
      },
      relations: ['mealPlan', 'mealFoods', 'mealFoods.food'],
    });

    if (!meal) {
      throw new HttpException('Meal not found', HttpStatus.NOT_FOUND);
    }

    return meal;
  }

  async addFoodToMeal(
    mealId: string,
    dto: AddFoodToMealDto,
    user: User,
  ): Promise<MealFood> {
    let mealFood: MealFood;

    await this.dataSource.transaction(async (manager) => {
      // Check if meal exists and belongs to user
      const meal = await this.getMealById(mealId, user);

      // Handle both custom and existing food
      let foodId: string;
      let foodData: Food;

      if (dto.foodId) {
        // Use existing food
        foodId = dto.foodId;
        foodData = await this.foodRepository.findOne({
          where: { id: foodId },
        });

        if (!foodData) {
          throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
        }
      } else if (dto.customFood) {
        // Create custom food for user
        const customFood = await this.foodService.createFood(
          {
            ...dto.customFood,
            isCustom: true,
          },
          user,
        );
        foodId = customFood.id;
        foodData = customFood;
      } else {
        throw new HttpException(
          'Either foodId or customFood must be provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calculate nutrients based on serving size
      const nutrients = this.nutritionCalculator.calculateNutrients(
        foodData,
        dto.servingSize,
      );

      // Create the meal food relationship
      mealFood = manager.create(MealFood, {
        meal: { id: meal.id },
        food: { id: foodId },
        servingSize: dto.servingSize,
        servingUnit: dto.servingUnit || foodData.servingUnit,
        nutrients,
      });

      await manager.save(mealFood);

      // Retrieve the full object with relations
      mealFood = await manager.findOne(MealFood, {
        where: { id: mealFood.id },
        relations: ['meal', 'food'],
      });

      // Get the meal plan ID for synchronization
      const mealPlanId = meal.mealPlan?.id;

      // Synchronize meal plan calorie distribution if we have a meal plan ID
      if (mealPlanId) {
        await this.mealPlanService.synchronizeCalorieDistribution(
          mealPlanId,
          user,
        );
      }
    });

    return mealFood;
  }

  async updateMeal(
    id: string,
    updateMealDto: UpdateMealDto,
    user: User,
  ): Promise<Meal> {
    const meal = await this.getMealById(id, user);

    // Handle time string conversion for targetTime if it's provided
    if (updateMealDto.targetTime) {
      const [hours, minutes] = updateMealDto.targetTime.split(':').map(Number);
      const timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);
      updateMealDto.targetTime = timeDate as any; // Using type assertion to resolve type mismatch
    }

    // Update meal
    await this.mealRepository.update(id, updateMealDto);

    // Get the updated meal
    const updatedMeal = await this.getMealById(id, user);

    // Synchronize calorie distribution with meals
    if (meal.mealPlan?.id) {
      await this.mealPlanService.synchronizeCalorieDistribution(
        meal.mealPlan.id,
        user,
      );
    }

    return updatedMeal;
  }

  async removeFoodFromMeal(
    mealId: string,
    foodId: string,
    user: User,
  ): Promise<void> {
    // Check if the meal exists and belongs to the user
    const meal = await this.getMealById(mealId, user);

    // Find the meal-food relationship
    const mealFood = await this.getMealFoodByIds(mealId, foodId, user);

    // Delete the meal-food relationship
    await this.mealFoodRepository.remove(mealFood);

    // Synchronize calorie distribution with meals
    if (meal.mealPlan?.id) {
      await this.mealPlanService.synchronizeCalorieDistribution(
        meal.mealPlan.id,
        user,
      );
    }
  }

  async getMealsByDate(date: Date, user: User): Promise<Meal[]> {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Find meals for the user on the specified date
    const meals = await this.mealRepository
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.mealPlan', 'mealPlan')
      .leftJoinAndSelect('meal.mealFoods', 'mealFoods')
      .leftJoinAndSelect('mealFoods.food', 'food')
      .where('mealPlan.user = :userId', { userId: user.id })
      .andWhere('DATE(meal.createdAt) = DATE(:date)', { date })
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
    // First check if the meal exists and belongs to the user
    await this.getMealById(mealId, user);

    // Find the meal-food relationship
    const mealFood = await this.mealFoodRepository.findOne({
      where: {
        meal: { id: mealId },
        food: { id: foodId },
      },
    });

    if (!mealFood) {
      throw new HttpException('Food not found in meal', HttpStatus.NOT_FOUND);
    }

    return mealFood;
  }

  async deleteMeal(id: string, user: User): Promise<void> {
    const meal = await this.getMealById(id, user);

    // Store the meal plan ID before deleting the meal
    const mealPlanId = meal.mealPlan?.id;

    await this.mealRepository.remove(meal);

    // Synchronize calorie distribution after meal deletion
    if (mealPlanId) {
      await this.mealPlanService.synchronizeCalorieDistribution(
        mealPlanId,
        user,
      );
    }
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

  async getAverageCalories(
    user: User,
  ): Promise<{ averageCalories: number; totalMeals: number }> {
    try {
      console.log('Starting getAverageCalories for user:', user?.id);

      // First try to get from actual meals
      const meals = await this.mealRepository.find({
        where: {
          mealPlan: {
            user: { id: user.id },
          },
        },
        relations: ['mealPlan', 'mealPlan.user'],
      });

      console.log('Found actual meals:', meals.length);

      if (meals.length > 0) {
        // Filter meals that have calories and calculate average
        const mealsWithCalories = meals.filter(
          (meal) =>
            meal.nutrients &&
            meal.nutrients.calories &&
            meal.nutrients.calories > 0,
        );

        if (mealsWithCalories.length > 0) {
          const totalCalories = mealsWithCalories.reduce(
            (sum, meal) => sum + (meal.nutrients.calories || 0),
            0,
          );
          const averageCalories = Math.round(
            totalCalories / mealsWithCalories.length,
          );

          console.log(
            'Using actual meals - Average:',
            averageCalories,
            'from',
            mealsWithCalories.length,
            'meals',
          );
          return {
            averageCalories,
            totalMeals: mealsWithCalories.length,
          };
        }
      }

      // If no actual meals with calories, try meal plans
      console.log('No actual meals found, trying meal plans...');
      return this.getAverageCaloriesFromMealPlans(user);
    } catch (error) {
      console.error('Error calculating average calories:', error);
      return {
        averageCalories: 0,
        totalMeals: 0,
      };
    }
  }

  async getAverageCaloriesFromMealPlans(
    user: User,
  ): Promise<{ averageCalories: number; totalMeals: number }> {
    try {
      console.log(
        'Getting average calories from meal plans for user:',
        user?.id,
      );

      const mealPlans = await this.dataSource.getRepository(MealPlan).find({
        where: { user: { id: user.id } },
      });

      console.log('Found meal plans:', mealPlans.length);

      if (mealPlans.length === 0) {
        return { averageCalories: 0, totalMeals: 0 };
      }

      let totalCalories = 0;
      let totalMealCount = 0;

      mealPlans.forEach((plan) => {
        if (
          plan.calorieDistribution &&
          Array.isArray(plan.calorieDistribution)
        ) {
          plan.calorieDistribution.forEach((meal) => {
            if (meal.calorieAmount && meal.calorieAmount > 0) {
              totalCalories += meal.calorieAmount;
              totalMealCount++;
            }
          });
        }
      });

      if (totalMealCount === 0) {
        return { averageCalories: 0, totalMeals: 0 };
      }

      const averageCalories = Math.round(totalCalories / totalMealCount);

      console.log(
        'Calculated average from meal plans:',
        averageCalories,
        'from',
        totalMealCount,
        'planned meals',
      );

      return {
        averageCalories,
        totalMeals: totalMealCount,
      };
    } catch (error) {
      console.error(
        'Error calculating average calories from meal plans:',
        error,
      );
      return { averageCalories: 0, totalMeals: 0 };
    }
  }
  async addFoodFromSearch(
    mealId: string,
    dto: {
      foodId: string;
      quantity: number;
      unit?: string;
      foodName?: string;
      isExternalApi?: boolean;
    },
    user: User,
  ): Promise<MealFood> {
    return await this.dataSource.transaction(async (manager) => {
      // Check if meal exists and belongs to user
      const meal = await this.getMealById(mealId, user);

      let foodData: Food;

      if (dto.isExternalApi !== false) {
        // Get food data from external API and save it to our database
        try {
          // Check if we already have this food in our database
          let existingFood = await this.foodRepository.findOne({
            where: { usdaId: dto.foodId },
          });

          if (!existingFood) {
            // Get food details from API and save to database
            const apiFood = await this.foodService.getFoodDetails(dto.foodId);
            foodData = await this.foodService.addToFavorites(apiFood, user);
          } else {
            foodData = existingFood;
          }
        } catch (error) {
          throw new HttpException(
            'Failed to fetch food data from external API',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        // Use existing food from our database
        foodData = await this.foodRepository.findOne({
          where: { id: dto.foodId },
        });

        if (!foodData) {
          throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
        }
      }

      // Calculate nutrients based on serving size
      const nutrients = this.nutritionCalculator.calculateNutrients(
        foodData,
        dto.quantity,
      );

      // Create the meal food relationship
      const mealFood = manager.create(MealFood, {
        meal: { id: meal.id },
        food: { id: foodData.id },
        servingSize: dto.quantity,
        servingUnit: dto.unit || foodData.servingUnit || 'g',
        nutrients,
      });

      await manager.save(mealFood);

      // Retrieve the full object with relations
      const savedMealFood = await manager.findOne(MealFood, {
        where: { id: mealFood.id },
        relations: ['meal', 'food'],
      });

      // Update meal nutrition totals
      await this.recalculateMealNutrition(meal);

      // Synchronize meal plan calorie distribution if we have a meal plan ID
      const mealPlanId = meal.mealPlan?.id;
      if (mealPlanId) {
        await this.mealPlanService.synchronizeCalorieDistribution(
          mealPlanId,
          user,
        );
      }

      return savedMealFood;
    });
  }

  async addCustomFoodToMeal(
    mealId: string,
    dto: {
      name: string;
      calories: number;
      quantity: number;
      unit?: string;
      protein: number;
      carbs: number;
      fat: number;
    },
    user: User,
  ): Promise<MealFood> {
    return await this.dataSource.transaction(async (manager) => {
      // Check if meal exists and belongs to user
      const meal = await this.getMealById(mealId, user);

      // Create custom food
      const customFood = manager.create(Food, {
        name: dto.name,
        calories: dto.calories,
        protein: dto.protein,
        carbohydrates: dto.carbs,
        fat: dto.fat,
        servingSize: dto.quantity,
        servingUnit: dto.unit || 'serving',
        isCustom: true,
        user: user,
      });

      await manager.save(customFood);

      // Calculate nutrients for the serving
      const nutrients = {
        calories: dto.calories,
        protein: dto.protein,
        carbohydrates: dto.carbs,
        fat: dto.fat,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
      };

      // Create the meal food relationship
      const mealFood = manager.create(MealFood, {
        meal: { id: meal.id },
        food: { id: customFood.id },
        servingSize: dto.quantity,
        servingUnit: dto.unit || 'serving',
        nutrients,
      });

      await manager.save(mealFood);

      // Retrieve the full object with relations
      const savedMealFood = await manager.findOne(MealFood, {
        where: { id: mealFood.id },
        relations: ['meal', 'food'],
      });

      // Update meal nutrition totals
      await this.recalculateMealNutrition(meal);

      // Synchronize meal plan calorie distribution if we have a meal plan ID
      const mealPlanId = meal.mealPlan?.id;
      if (mealPlanId) {
        await this.mealPlanService.synchronizeCalorieDistribution(
          mealPlanId,
          user,
        );
      }

      return savedMealFood;
    });
  }

  async addFoodFromSearchOptimized(
    mealId: string,
    dto: {
      foodId: string;
      quantity: number;
      unit?: string;
      foodData?: {
        name: string;
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber?: number;
        sugar?: number;
        sodium?: number;
      };
    },
    user: User,
  ): Promise<MealFood> {
    return await this.dataSource.transaction(async (manager) => {
      // Check if meal exists and belongs to user
      const meal = await this.getMealById(mealId, user);

      let foodData: Food;

      // Check if we already have this food in our database
      let existingFood = await this.foodRepository.findOne({
        where: { usdaId: dto.foodId },
      });

      if (existingFood) {
        foodData = existingFood;
      } else {
        // Create food record directly from provided data (no API call needed)
        if (dto.foodData) {
          const newFood = manager.create(Food, {
            name: dto.foodData.name,
            usdaId: dto.foodId,
            calories: dto.foodData.calories,
            protein: dto.foodData.protein,
            carbohydrates: dto.foodData.carbohydrates,
            fat: dto.foodData.fat,
            fiber: dto.foodData.fiber || 0,
            sugar: dto.foodData.sugar || 0,
            sodium: dto.foodData.sodium || 0,
            servingSize: 100,
            servingUnit: 'g',
            isCustom: false,
            user: user,
          });

          foodData = await manager.save(newFood);
        } else {
          // Fallback to API call if no data provided
          try {
            const apiFood = await this.foodService.getFoodDetails(dto.foodId);
            foodData = await this.foodService.addToFavorites(apiFood, user);
          } catch (error) {
            throw new HttpException(
              'Failed to fetch food data from external API',
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      // Calculate nutrients based on serving size
      const nutrients = this.nutritionCalculator.calculateNutrients(
        foodData,
        dto.quantity,
      );

      // Create the meal food relationship
      const mealFood = manager.create(MealFood, {
        meal: { id: meal.id },
        food: { id: foodData.id },
        servingSize: dto.quantity,
        servingUnit: dto.unit || foodData.servingUnit || 'g',
        nutrients,
      });

      await manager.save(mealFood);

      // Retrieve the full object with relations
      const savedMealFood = await manager.findOne(MealFood, {
        where: { id: mealFood.id },
        relations: ['meal', 'food'],
      });

      // Update meal nutrition totals
      await this.recalculateMealNutrition(meal);

      // Synchronize meal plan calorie distribution if we have a meal plan ID
      const mealPlanId = meal.mealPlan?.id;
      if (mealPlanId) {
        await this.mealPlanService.synchronizeCalorieDistribution(
          mealPlanId,
          user,
        );
      }

      return savedMealFood;
    });
  }

  async removeFoodFromMealByMealFoodId(
    mealFoodId: string,
    user: User,
  ): Promise<void> {
    // Find the meal food relationship and check if it belongs to the user
    const mealFood = await this.mealFoodRepository.findOne({
      where: { id: mealFoodId },
      relations: ['meal', 'meal.mealPlan', 'meal.mealPlan.user'],
    });

    if (!mealFood) {
      throw new HttpException(
        'Food item not found in meal',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if the meal belongs to the user
    if (mealFood.meal.mealPlan.user.id !== user.id) {
      throw new HttpException(
        'Unauthorized to remove this food item',
        HttpStatus.FORBIDDEN,
      );
    }

    // Store meal plan ID for synchronization
    const mealPlanId = mealFood.meal.mealPlan?.id;

    // Delete the meal-food relationship
    await this.mealFoodRepository.remove(mealFood);

    // Recalculate meal nutrition
    await this.recalculateMealNutrition(mealFood.meal);

    // Synchronize calorie distribution with meals
    if (mealPlanId) {
      await this.mealPlanService.synchronizeCalorieDistribution(
        mealPlanId,
        user,
      );
    }
  }
}
