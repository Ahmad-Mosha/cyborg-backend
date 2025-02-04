// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, Between } from 'typeorm';
// import { Food } from './entities/food.entity';
// import { Meal } from './entities/meal.entity';
// import { MealFood } from './entities/meal-food.entity';
// import { CreateFoodDto } from './dto/create-food.dto';
// import { CreateMealDto } from './dto/create-meal.dto';
// import { User } from '../users/entities/user.entity';
// import { startOfDay, endOfDay } from 'date-fns';

// @Injectable()
// export class NutritionService {
//   constructor(
//     @InjectRepository(Food)
//     private foodRepository: Repository<Food>,
//     @InjectRepository(Meal)
//     private mealRepository: Repository<Meal>,
//     @InjectRepository(MealFood)
//     private mealFoodRepository: Repository<MealFood>,
//   ) {}

//   // Food Methods
//   async createFood(user: User, createFoodDto: CreateFoodDto): Promise<Food> {
//     const food = this.foodRepository.create({
//       ...createFoodDto,
//       creator: user,
//     });
//     return await this.foodRepository.save(food);
//   }

//   async searchFoods(query: string): Promise<Food[]> {
//     return await this.foodRepository
//       .createQueryBuilder('food')
//       .where('food.name LIKE :query OR food.brand LIKE :query', {
//         query: `%${query}%`,
//       })
//       .orderBy('food.isVerified', 'DESC')
//       .addOrderBy('food.name', 'ASC')
//       .take(20)
//       .getMany();
//   }

//   async getFood(id: string): Promise<Food> {
//     const food = await this.foodRepository.findOne({ where: { id } });
//     if (!food) {
//       throw new NotFoundException('Food not found');
//     }
//     return food;
//   }

//   // Meal Methods
//   async createMeal(user: User, createMealDto: CreateMealDto): Promise<Meal> {
//     const meal = this.mealRepository.create({
//       name: createMealDto.name,
//       type: createMealDto.type,
//       consumedAt: createMealDto.consumedAt,
//       notes: createMealDto.notes,
//       user,
//     });

//     const savedMeal = await this.mealRepository.save(meal);

//     let totalCalories = 0;
//     let totalProtein = 0;
//     let totalCarbs = 0;
//     let totalFat = 0;

//     for (const foodItem of createMealDto.foods) {
//       const food = await this.getFood(foodItem.foodId);
//       const multiplier = foodItem.servingSize / food.servingSize;

//       const mealFood = this.mealFoodRepository.create({
//         meal: savedMeal,
//         food,
//         servingSize: foodItem.servingSize,
//         servingUnit: foodItem.servingUnit,
//         calories: food.calories * multiplier,
//         protein: food.protein * multiplier,
//         carbs: food.carbs * multiplier,
//         fat: food.fat * multiplier,
//       });

//       await this.mealFoodRepository.save(mealFood);

//       totalCalories += mealFood.calories;
//       totalProtein += mealFood.protein;
//       totalCarbs += mealFood.carbs;
//       totalFat += mealFood.fat;
//     }

//     savedMeal.totalCalories = totalCalories;
//     savedMeal.totalProtein = totalProtein;
//     savedMeal.totalCarbs = totalCarbs;
//     savedMeal.totalFat = totalFat;

//     return await this.mealRepository.save(savedMeal);
//   }

//   async getUserMeals(user: User, date: Date): Promise<Meal[]> {
//     return await this.mealRepository.find({
//       where: {
//         user: { id: user.id },
//         consumedAt: Between(startOfDay(date), endOfDay(date)),
//       },
//       relations: ['mealFoods', 'mealFoods.food'],
//       order: { consumedAt: 'ASC' },
//     });
//   }

//   async getDailyNutrition(user: User, date: Date) {
//     const meals = await this.getUserMeals(user, date);

//     const dailyTotals = {
//       calories: 0,
//       protein: 0,
//       carbs: 0,
//       fat: 0,
//       meals: meals,
//     };

//     meals.forEach((meal) => {
//       dailyTotals.calories += meal.totalCalories;
//       dailyTotals.protein += meal.totalProtein;
//       dailyTotals.carbs += meal.totalCarbs;
//       dailyTotals.fat += meal.totalFat;
//     });

//     return {
//       ...dailyTotals,
//       remainingCalories: user.dailyCalorieGoal
//         ? user.dailyCalorieGoal - dailyTotals.calories
//         : null,
//       remainingProtein: user.dailyProteinGoal
//         ? user.dailyProteinGoal - dailyTotals.protein
//         : null,
//       remainingCarbs: user.dailyCarbsGoal
//         ? user.dailyCarbsGoal - dailyTotals.carbs
//         : null,
//       remainingFat: user.dailyFatGoal
//         ? user.dailyFatGoal - dailyTotals.fat
//         : null,
//     };
//   }

//   async deleteMeal(user: User, mealId: string): Promise<void> {
//     const meal = await this.mealRepository.findOne({
//       where: { id: mealId, user: { id: user.id } },
//     });

//     if (!meal) {
//       throw new NotFoundException('Meal not found');
//     }

//     await this.mealRepository.remove(meal);
//   }
// }
