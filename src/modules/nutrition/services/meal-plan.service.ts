import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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

      // Check if calorieDistribution is provided and valid
      if (dto.calorieDistribution && dto.calorieDistribution.length > 0) {
        // Filter out any empty objects
        dto.calorieDistribution = dto.calorieDistribution.filter(meal => 
          meal && meal.mealName && typeof meal.percentage === 'number');
        
        // Validate the sum of percentages if distribution is provided
        if (dto.calorieDistribution.length > 0 && !this.validateCalorieDistribution(dto.calorieDistribution)) {
          throw new HttpException(
            'Total percentage of calorie distribution must equal 100%',
            HttpStatus.BAD_REQUEST
          );
        }
      } 
      
      // If calorieDistribution is empty or not provided, create a default distribution
      if (!dto.calorieDistribution || dto.calorieDistribution.length === 0) {
        dto.calorieDistribution = this.createDefaultCalorieDistribution();
      }

      // Calculate calorie amounts for each meal
      dto.calorieDistribution = dto.calorieDistribution.map(meal => ({
        ...meal,
        calorieAmount: Math.round((meal.percentage / 100) * dto.targetCalories)
      }));

      // Create the meal plan
      const mealPlan = manager.create(MealPlan, {
        ...dto,
        user: { id: user.id },
      });

      // Save the meal plan
      const savedMealPlan = await manager.save(mealPlan);

      // Create default meals based on the calorie distribution
      const defaultMealTimes = {
        'Breakfast': '08:00',
        'Lunch': '13:00',
        'Dinner': '19:00',
        // Add more default times for other meal names as needed
      };

      // Create meals for the meal plan
      for (const mealDist of dto.calorieDistribution) {
        // Convert time string to Date object for storage
        const timeStr = defaultMealTimes[mealDist.mealName] || '12:00';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        
        // Calculate macronutrient goals based on calorie distribution
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
          mealPlan: { id: savedMealPlan.id }
        });
        
        await manager.save(meal);
      }

      // Return the complete meal plan with meals
      return this.getMealPlanById(savedMealPlan.id, user);
    });
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

    // Check if calorieDistribution is being updated and validate it
    if (updateMealPlanDto.calorieDistribution) {
      // Filter out empty objects
      updateMealPlanDto.calorieDistribution = updateMealPlanDto.calorieDistribution.filter(meal => 
        meal && meal.mealName && typeof meal.percentage === 'number');
      
      if (updateMealPlanDto.calorieDistribution.length > 0 && 
          !this.validateCalorieDistribution(updateMealPlanDto.calorieDistribution)) {
        throw new HttpException(
          'Total percentage of calorie distribution must equal 100%',
          HttpStatus.BAD_REQUEST
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

  private validateCalorieDistribution(calorieDistribution: any[]): boolean {
    if (!calorieDistribution?.length) return true;
    
    const totalPercentage = calorieDistribution.reduce(
      (sum, meal) => sum + meal.percentage, 
      0
    );
    
    return Math.abs(totalPercentage - 100) < 0.1; // Allow a small margin of error for floating point
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
              food: { id: mealFood.food.id },
              eaten: false,
              eatenAt: null
            });

            await manager.save(newMealFood);
          }
        }
      }

      return this.getMealPlanById(savedPlan.id, user);
    });
  }
}