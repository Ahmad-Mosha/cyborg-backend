import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MealPlan } from '../entities/meal-plan.entity';
import { User } from '../../users/entities/user.entity';
import { CreateMealPlanDto } from '../dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from '../dto/update-meal-plan.dto';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Meal } from '../entities/meal.entity';
import { MealFood } from '../entities/meal-food.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MealPlanService {
  private readonly logger = new Logger(MealPlanService.name);
  
  constructor(
    @InjectRepository(MealPlan)
    private readonly mealPlanRepository: Repository<MealPlan>,
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
    private readonly dataSource: DataSource,
  ) {}

  async createMealPlan(dto: CreateMealPlanDto, user: User): Promise<MealPlan> {
    return await this.dataSource.transaction(async manager => {
      // If no start date is provided, use today's date
      if (!dto.startDate) {
        dto.startDate = new Date();
      }

      // Set default target calories if not provided
      if (!dto.targetCalories) {
        dto.targetCalories = 2000; // Default value
      }

      // Initialize calorie distribution
      let calorieDistribution = [];
      
      // Check if calorieDistribution is provided
      if (dto.calorieDistribution && dto.calorieDistribution.length > 0) {
        // Filter out any empty objects
        calorieDistribution = dto.calorieDistribution.filter(meal => 
          meal && meal.mealName && typeof meal.percentage === 'number');
        
        // Auto-adjust percentages to sum to 100% if they don't already
        if (calorieDistribution.length > 0) {
          calorieDistribution = this.normalizeCalorieDistribution(calorieDistribution);
        }
      }
      
      // If calorieDistribution is still empty after filtering, create a default distribution
      if (calorieDistribution.length === 0) {
        calorieDistribution = this.createDefaultCalorieDistribution();
      }

      // Calculate calorie amounts for each meal
      calorieDistribution = calorieDistribution.map(meal => ({
        ...meal,
        calorieAmount: Math.round((meal.percentage / 100) * dto.targetCalories)
      }));

      // Create the meal plan
      const mealPlan = manager.create(MealPlan, {
        ...dto,
        calorieDistribution,
        user: { id: user.id },
        createMealsAutomatically: dto.createMealsAutomatically !== false // Default to true if not specified
      });

      // Save the meal plan
      const savedMealPlan = await manager.save(mealPlan);

      // Only create meals automatically if specified (or by default)
      if (mealPlan.createMealsAutomatically !== false) {
        await this.createMealsForPlan(manager, savedMealPlan.id, calorieDistribution, user);
      }

      // Return the complete meal plan with meals
      return this.getMealPlanById(savedMealPlan.id, user);
    });
  }
  
  /**
   * Creates meals for a meal plan based on calorie distribution
   */
  private async createMealsForPlan(
    manager: any,
    mealPlanId: string,
    calorieDistribution: any[],
    user: User
  ) {
    // Default meal times based on common meal names
    const defaultMealTimes = {
      'Breakfast': '08:00',
      'Morning Snack': '10:30',
      'Lunch': '13:00',
      'Afternoon Snack': '16:00',
      'Dinner': '19:00',
      'Evening Snack': '21:00',
    };

    // Create meals for the meal plan
    for (const mealDist of calorieDistribution) {
      // Convert time string to Date object for storage
      const timeStr = defaultMealTimes[mealDist.mealName] || '12:00';
      const [hours, minutes] = timeStr.split(':').map(Number);
      const timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);
      
      // Default macronutrient goals - these are optional and can be adjusted by the user later
      const proteinPercentage = 25; // 25% calories from protein
      const carbsPercentage = 50;   // 50% calories from carbs
      const fatPercentage = 25;     // 25% calories from fat
      
      const meal = manager.create(Meal, {
        name: mealDist.mealName,
        targetTime: timeDate,
        targetCalories: mealDist.calorieAmount,
        nutritionGoals: {
          protein: Math.round((proteinPercentage / 100) * mealDist.calorieAmount / 4), // 4 calories per gram
          carbs: Math.round((carbsPercentage / 100) * mealDist.calorieAmount / 4),    // 4 calories per gram
          fat: Math.round((fatPercentage / 100) * mealDist.calorieAmount / 9)         // 9 calories per gram
        },
        mealPlan: { id: mealPlanId }
      });
      
      await manager.save(meal);
    }
  }

  /**
   * Normalizes calorie distribution to ensure percentages sum to 100%
   */
  private normalizeCalorieDistribution(distribution: any[]): any[] {
    // Calculate current total percentage
    const totalPercentage = distribution.reduce(
      (sum, meal) => sum + meal.percentage, 
      0
    );
    
    // If percentages are already valid (close to 100%), return as is
    if (Math.abs(totalPercentage - 100) < 0.1) {
      return distribution;
    }
    
    this.logger.log(`Normalizing calorie distribution from ${totalPercentage}% to 100%`);
    
    // Normalize all percentages to sum to 100%
    return distribution.map(meal => ({
      ...meal,
      percentage: (meal.percentage / totalPercentage) * 100
    }));
  }
  
  /**
   * Adjusts meal percentages when adding a new meal to a plan that already has 100%
   */
  async adjustMealPercentagesForNewMeal(
    mealPlanId: string, 
    newMealPercentage: number, 
    user: User
  ): Promise<any[]> {
    const mealPlan = await this.getMealPlanById(mealPlanId, user);
    
    if (!mealPlan || !mealPlan.calorieDistribution || mealPlan.calorieDistribution.length === 0) {
      // If no existing distribution, just return the new meal with 100%
      return [{ mealName: 'New Meal', percentage: 100 }];
    }
    
    // Cap the new meal percentage at a reasonable value (max 50%)
    newMealPercentage = Math.min(newMealPercentage || 20, 50);
    
    // Calculate how much to reduce each existing meal's percentage
    const existingMeals = [...mealPlan.calorieDistribution];
    const totalExistingPercentage = 100;
    const reductionFactor = (totalExistingPercentage - newMealPercentage) / totalExistingPercentage;
    
    // Adjust each existing meal's percentage
    const adjustedDistribution = existingMeals.map(meal => ({
      ...meal,
      percentage: meal.percentage * reductionFactor
    }));
    
    // Add the new meal
    adjustedDistribution.push({
      mealName: 'New Meal',
      percentage: newMealPercentage
    });
    
    // Recalculate calorie amounts
    return adjustedDistribution.map(meal => ({
      ...meal,
      calorieAmount: Math.round((meal.percentage / 100) * mealPlan.targetCalories)
    }));
  }

  // Create a default calorie distribution for three meals
  private createDefaultCalorieDistribution() {
    return [
      { mealName: 'Breakfast', percentage: 25 },
      { mealName: 'Lunch', percentage: 40 },
      { mealName: 'Dinner', percentage: 35 }
    ];
  }

  async getMealPlans(user: User, page = 1, pageSize = 10) {
    // Ensure positive values for page and pageSize
    page = Math.max(1, page);
    pageSize = Math.max(1, pageSize);

    const [mealPlans, total] = await this.mealPlanRepository.findAndCount({
      where: { user: { id: user.id } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return {
      data: mealPlans,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getMealPlanById(id: string, user: User): Promise<MealPlan> {
    // Use a query builder for more control over the query
    const mealPlan = await this.mealPlanRepository
      .createQueryBuilder('mealPlan')
      .leftJoinAndSelect('mealPlan.meals', 'meals')
      .leftJoinAndSelect('meals.mealFoods', 'mealFoods')
      .leftJoinAndSelect('mealFoods.food', 'food')
      .where('mealPlan.id = :id', { id })
      .andWhere('mealPlan.user = :userId', { userId: user.id })
      .getOne();

    if (!mealPlan) {
      throw new HttpException('Meal plan not found', HttpStatus.NOT_FOUND);
    }

    // Filter out any undefined or null meals that might remain after deletion
    if (mealPlan.meals) {
      mealPlan.meals = mealPlan.meals.filter(meal => meal && meal.id);
    }

    return mealPlan;
  }

  async updateMealPlan(id: string, updateMealPlanDto: UpdateMealPlanDto, user: User): Promise<MealPlan> {
    // Check if the meal plan exists and belongs to the user
    const existingPlan = await this.getMealPlanById(id, user);
    
    if (!existingPlan) {
      throw new HttpException('Meal plan not found', HttpStatus.NOT_FOUND);
    }

    // Validate that there's at least one field to update
    if (Object.keys(updateMealPlanDto).length === 0) {
      throw new HttpException('No update data provided', HttpStatus.BAD_REQUEST);
    }

    // Check if calorieDistribution is being updated
    if (updateMealPlanDto.calorieDistribution) {
      // Filter out empty objects
      updateMealPlanDto.calorieDistribution = updateMealPlanDto.calorieDistribution.filter(meal => 
        meal && meal.mealName && typeof meal.percentage === 'number');
      
      // Normalize calorie distribution to sum to 100%
      if (updateMealPlanDto.calorieDistribution.length > 0) {
        updateMealPlanDto.calorieDistribution = this.normalizeCalorieDistribution(
          updateMealPlanDto.calorieDistribution
        );
      }

      // Calculate calorie amounts if targetCalories is available
      const targetCalories = updateMealPlanDto.targetCalories || existingPlan.targetCalories;
      if (targetCalories) {
        updateMealPlanDto.calorieDistribution = updateMealPlanDto.calorieDistribution.map(meal => ({
          ...meal,
          calorieAmount: Math.round((meal.percentage / 100) * targetCalories)
        }));
      }
    }

    try {
      // Update only the provided fields while keeping the same ID
      const updatedPlan = await this.mealPlanRepository.save({
        ...existingPlan,
        ...updateMealPlanDto,
        id: existingPlan.id, // Ensure we keep the same ID
        user: { id: user.id } // Maintain user relationship
      });

      return await this.getMealPlanById(updatedPlan.id, user);
    } catch (error) {
      console.error('Error updating meal plan:', error);
      throw new HttpException(
        'Failed to update meal plan',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getMealPlanByDate(date: Date, user: User): Promise<MealPlan> {
    const mealPlan = await this.mealPlanRepository.findOne({
      where: {
        user: { id: user.id },
        startDate: LessThanOrEqual(date),
        endDate: MoreThanOrEqual(date)
      },
      relations: ['meals', 'meals.mealFoods', 'meals.mealFoods.food']
    });

    return mealPlan;
  }

  async deleteMealPlan(id: string, user: User): Promise<void> {
    const result = await this.mealPlanRepository.delete({
      id,
      user: { id: user.id }
    });

    if (result.affected === 0) {
      throw new HttpException('Meal plan not found', HttpStatus.NOT_FOUND);
    }
  }

  async duplicateMealPlan(sourcePlanId: string, user: User, targetDate?: Date): Promise<MealPlan> {
    return await this.dataSource.transaction(async manager => {
      const sourcePlan = await this.getMealPlanById(sourcePlanId, user);
      
      // Create a new plan based on the source plan
      const newPlan = manager.create(MealPlan, {
        ...sourcePlan,
        id: undefined, // Let the DB generate a new ID
        name: `Copy of ${sourcePlan.name}`,
        startDate: targetDate || new Date(),
        user: { id: user.id }
      });

      const savedPlan = await manager.save(newPlan);

      // Duplicate all meals from the source plan
      for (const meal of sourcePlan.meals) {
        const newMeal = manager.create(Meal, {
          ...meal,
          id: undefined, // Let the DB generate a new ID
          mealPlan: { id: savedPlan.id },
          eaten: false,
          eatenAt: null
        });

        const savedMeal = await manager.save(newMeal);

        // Duplicate all food items in each meal
        if (meal.mealFoods && meal.mealFoods.length > 0) {
          for (const mealFood of meal.mealFoods) {
            if (!mealFood.food) continue; // Skip if no food reference
            
            const newMealFood = manager.create(MealFood, {
              servingSize: mealFood.servingSize,
              servingUnit: mealFood.servingUnit,
              nutrients: mealFood.nutrients,
              meal: { id: savedMeal.id },
              food: { id: mealFood.food.id }
            });

            await manager.save(newMealFood);
          }
        }
      }

      return this.getMealPlanById(savedPlan.id, user);
    });
  }
  
  /**
   * Creates a new meal in an existing meal plan with automatic percentage adjustment
   */
  async addMealToPlan(
    mealPlanId: string, 
    mealName: string, 
    targetTime: string,
    targetCalories?: number,
    percentage?: number,
    user?: User
  ): Promise<Meal> {
    return await this.dataSource.transaction(async manager => {
      // Get the meal plan
      const mealPlan = await this.getMealPlanById(mealPlanId, user);
      
      if (!mealPlan) {
        throw new HttpException('Meal plan not found', HttpStatus.NOT_FOUND);
      }
      
      // Default percentage if not provided
      const newMealPercentage = percentage || 20; // Default to 20% if not specified
      
      // Adjust existing meal percentages
      const adjustedDistribution = await this.adjustMealPercentagesForNewMeal(
        mealPlanId,
        newMealPercentage,
        user
      );
      
      // Convert time string to Date object
      let timeDate;
      if (targetTime) {
        const [hours, minutes] = targetTime.split(':').map(Number);
        timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
      } else {
        // Default time if not provided
        timeDate = new Date();
        timeDate.setHours(12, 0, 0, 0); // Default to noon
      }
      
      // Calculate calories for this meal if not provided
      let mealCalories = targetCalories;
      if (!mealCalories) {
        const mealDist = adjustedDistribution.find(m => m.mealName === mealName);
        mealCalories = mealDist ? mealDist.calorieAmount : Math.round(0.2 * mealPlan.targetCalories);
      }
      
      // Default macronutrient distribution
      const proteinPercentage = 25;
      const carbsPercentage = 50;
      const fatPercentage = 25;
      
      // Create the new meal
      const meal = manager.create(Meal, {
        name: mealName,
        targetTime: timeDate,
        targetCalories: mealCalories,
        nutritionGoals: {
          protein: Math.round((proteinPercentage / 100) * mealCalories / 4),
          carbs: Math.round((carbsPercentage / 100) * mealCalories / 4),
          fat: Math.round((fatPercentage / 100) * mealCalories / 9)
        },
        mealPlan: { id: mealPlanId }
      });
      
      const savedMeal = await manager.save(meal);
      
      // Update the plan's calorie distribution
      await this.mealPlanRepository.save({
        ...mealPlan,
        calorieDistribution: adjustedDistribution
      });
      
      return savedMeal;
    });
  }
}