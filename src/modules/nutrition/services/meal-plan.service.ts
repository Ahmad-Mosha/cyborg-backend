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

@Injectable()
export class MealPlanService {
  constructor(
    @InjectRepository(MealPlan)
    private readonly mealPlanRepository: Repository<MealPlan>,
    private readonly dataSource: DataSource,
  ) {}

  async createMealPlan(dto: CreateMealPlanDto, user: User): Promise<MealPlan> {
    return await this.dataSource.transaction(async manager => {
      if (!this.validateCalorieDistribution(dto.calorieDistribution)) {
        throw new HttpException(
          'Total percentage of calorie distribution must equal 100%',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!dto.targetCalories) {
        dto.targetCalories = 2000; // Default value
      }

      if (dto.calorieDistribution && dto.targetCalories) {
        dto.calorieDistribution = dto.calorieDistribution.map(meal => ({
          ...meal,
          calorieAmount: (meal.percentage / 100) * dto.targetCalories
        }));
      }

      const mealPlan = manager.create(MealPlan, {
        ...dto,
        user: { id: user.id },
      });

      return await manager.save(mealPlan);
    });
  }

  async getMealPlans(user: User, page = 1, pageSize = 10) {
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
    const mealPlan = await this.mealPlanRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['meals', 'meals.mealFoods', 'meals.mealFoods.food'],
    });

    if (!mealPlan) {
      throw new HttpException('Meal plan not found', HttpStatus.NOT_FOUND);
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
    
    return Math.abs(totalPercentage - 100) < 0.1;
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
      
      const newPlan = manager.create(MealPlan, {
        ...sourcePlan,
        id: undefined,
        startDate: targetDate || new Date(),
        user: { id: user.id }
      });

      const savedPlan = await manager.save(newPlan);

      for (const meal of sourcePlan.meals) {
        const newMeal = manager.create(Meal, {
          ...meal,
          id: undefined,
          mealPlan: { id: savedPlan.id }
        });

        const savedMeal = await manager.save(newMeal);

        for (const mealFood of meal.mealFoods) {
          const newMealFood = manager.create(MealFood, {
            ...mealFood,
            id: undefined,
            meal: { id: savedMeal.id },
            eaten: false,
            eatenAt: null
          });

          await manager.save(newMealFood);
        }
      }

      return savedPlan;
    });
  }
} 