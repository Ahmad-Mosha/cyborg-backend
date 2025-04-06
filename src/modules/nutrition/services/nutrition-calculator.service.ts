import { Injectable } from '@nestjs/common';
import { MealFood } from '../entities/meal-food.entity';
import { DailyNutritionSummary, SimplifiedMeal, NutrientInfo } from '../interfaces/daily-nutrition-summary.interface';
import { NutrientCalculation } from '../types/nutrition.types';
import { Meal } from '../entities/meal.entity';

@Injectable()
export class NutritionCalculatorService {
  calculateNutrients(food: any, servingSize: number): NutrientCalculation {
    const ratio = servingSize / (food.servingSize || 100);
    
    return {
      calories: (4 * (food.protein || 0) + 4 * (food.carbohydrates || 0) + 9 * (food.fat || 0)) * ratio,
      protein: (food.protein || 0) * ratio,
      carbohydrates: (food.carbohydrates || 0) * ratio,
      fat: (food.fat || 0) * ratio,
      fiber: (food.fiber || 0) * ratio,
      sugar: (food.sugar || 0) * ratio,
      sodium: (food.sodium || 0) * ratio,
      cholesterol: (food.cholesterol || 0) * ratio
    };
  }

  calculateDailyNutrition(date: Date, mealFoods: MealFood[]): DailyNutritionSummary {
    console.log('Calculating nutrition for date:', date);
    console.log('Number of meal foods:', mealFoods.length);

    const summary: DailyNutritionSummary = {
      date: date,
      summary: {
        calories: {
          target: 0,
          eaten: 0,
          remaining: 0
        },
        mainNutrients: {
          protein: { amount: 0, unit: 'g', percentage: 0 },
          carbs: { amount: 0, unit: 'g', percentage: 0 },
          fat: { amount: 0, unit: 'g', percentage: 0 }
        },
        additionalNutrients: {
          fiber: { amount: 0, unit: 'g' },
          sugar: { amount: 0, unit: 'g' },
          sodium: { amount: 0, unit: 'mg' },
          cholesterol: { amount: 0, unit: 'mg' }
        }
      },
      meals: [],
      progress: {
        mealsEaten: 0,
        totalMeals: 0,
        percentage: 0
      },
      mealDistribution: []
    };

    const mealSummaries = new Map<string, SimplifiedMeal>();
    let totalCaloriesEaten = 0;
    let targetCalories = 0;

    for (const mealFood of mealFoods) {
      if (!mealFood.food || !mealFood.meal) {
        console.log('Skipping meal food due to missing food or meal:', mealFood);
        continue;
      }

      const { food, meal } = mealFood;
      
      if (!mealSummaries.has(meal.id)) {
        mealSummaries.set(meal.id, {
          id: meal.id,
          name: meal.name,
          time: meal.targetTime.toTimeString().slice(0, 5),
          status: meal.eaten ? 'eaten' : 'not_eaten',
          calories: {
            target: meal.targetCalories || 0,
            actual: 0
          },
          foods: []
        });

        targetCalories += meal.targetCalories || 0;
        if (meal.eaten) {
          summary.progress.mealsEaten++;
        }
        summary.progress.totalMeals++;
      }

      const currentMeal = mealSummaries.get(meal.id);
      const nutrients = this.calculateNutrients(food, mealFood.servingSize);

      if (mealFood.eaten) {
        totalCaloriesEaten += nutrients.calories;
        currentMeal.calories.actual += nutrients.calories;
        
        summary.summary.mainNutrients.protein.amount += nutrients.protein;
        summary.summary.mainNutrients.carbs.amount += nutrients.carbohydrates;
        summary.summary.mainNutrients.fat.amount += nutrients.fat;
        
        summary.summary.additionalNutrients.fiber.amount += nutrients.fiber;
        summary.summary.additionalNutrients.sugar.amount += nutrients.sugar;
        summary.summary.additionalNutrients.sodium.amount += nutrients.sodium;
        summary.summary.additionalNutrients.cholesterol.amount += nutrients.cholesterol;
      }

      currentMeal.foods.push({
        name: food.name,
        amount: `${mealFood.servingSize}${mealFood.servingUnit}`,
        calories: nutrients.calories,
        eaten: mealFood.eaten
      });
    }

    summary.summary.calories = {
      target: targetCalories,
      eaten: totalCaloriesEaten,
      remaining: targetCalories - totalCaloriesEaten
    };

    if (totalCaloriesEaten > 0) {
      summary.summary.mainNutrients.protein.percentage = 
        (summary.summary.mainNutrients.protein.amount * 4 / totalCaloriesEaten) * 100;
      summary.summary.mainNutrients.carbs.percentage = 
        (summary.summary.mainNutrients.carbs.amount * 4 / totalCaloriesEaten) * 100;
      summary.summary.mainNutrients.fat.percentage = 
        (summary.summary.mainNutrients.fat.amount * 9 / totalCaloriesEaten) * 100;
    }

    summary.progress.percentage = 
      summary.progress.totalMeals > 0 ? 
      (summary.progress.mealsEaten / summary.progress.totalMeals) * 100 : 0;

    summary.meals = Array.from(mealSummaries.values());

    return summary;
  }

  calculateMealNutrition(meal: Meal) {
    if (!meal.mealFoods?.length) {
      return {
        name: meal.name,
        targetTime: meal.targetTime,
        status: {
          eaten: meal.eaten,
          eatenAt: meal.eatenAt,
          onTime: meal.eatenAt ? meal.eatenAt <= meal.targetTime : null
        },
        nutrition: {
          target: {
            calories: meal.targetCalories || 0,
            ...meal.nutritionGoals
          },
          actual: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          },
          progress: {
            percentage: 0,
            remaining: meal.targetCalories || 0
          }
        },
        foods: []
      };
    }

    const summary = {
      name: meal.name,
      targetTime: meal.targetTime,
      status: {
        eaten: meal.eaten,
        eatenAt: meal.eatenAt,
        onTime: meal.eatenAt ? meal.eatenAt <= meal.targetTime : null
      },
      nutrition: {
        target: {
          calories: meal.targetCalories || 0,
          ...meal.nutritionGoals
        },
        actual: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        },
        progress: {
          percentage: 0,
          remaining: meal.targetCalories || 0
        }
      },
      foods: []
    };

    for (const mealFood of meal.mealFoods) {
      const nutrients = this.calculateNutrients(mealFood.food, mealFood.servingSize);
      
      // Add food to the list with its status
      summary.foods.push({
        id: mealFood.id,
        name: mealFood.food.name,
        serving: {
          size: mealFood.servingSize,
          unit: mealFood.servingUnit
        },
        nutrients: {
          calories: nutrients.calories,
          protein: nutrients.protein,
          carbs: nutrients.carbohydrates,
          fat: nutrients.fat
        },
        status: {
          eaten: mealFood.eaten,
          eatenAt: mealFood.eatenAt,
          onTime: mealFood.eatenAt ? mealFood.eatenAt <= meal.targetTime : null
        }
      });

      // Only add to totals if eaten
      if (mealFood.eaten) {
        summary.nutrition.actual.calories += nutrients.calories;
        summary.nutrition.actual.protein += nutrients.protein;
        summary.nutrition.actual.carbs += nutrients.carbohydrates;
        summary.nutrition.actual.fat += nutrients.fat;
      }
    }

    // Calculate progress
    if (summary.nutrition.target.calories > 0) {
      summary.nutrition.progress.percentage = 
        (summary.nutrition.actual.calories / summary.nutrition.target.calories) * 100;
      summary.nutrition.progress.remaining = 
        summary.nutrition.target.calories - summary.nutrition.actual.calories;
    }

    return summary;
  }

  calculateWeeklyNutrition(startDate: Date, endDate: Date, dailySummaries: DailyNutritionSummary[]) {
    const weeklyTotals = {
      calories: {
        target: 0,
        eaten: 0,
        average: 0
      },
      nutrients: {
        protein: { amount: 0, unit: 'g' },
        carbs: { amount: 0, unit: 'g' },
        fat: { amount: 0, unit: 'g' }
      },
      progress: {
        totalMealsEaten: 0,
        totalMealsPlanned: 0,
        percentage: 0
      }
    };

    // Calculate totals
    dailySummaries.forEach(day => {
      weeklyTotals.calories.target += day.summary.calories.target;
      weeklyTotals.calories.eaten += day.summary.calories.eaten;
      
      weeklyTotals.nutrients.protein.amount += day.summary.mainNutrients.protein.amount;
      weeklyTotals.nutrients.carbs.amount += day.summary.mainNutrients.carbs.amount;
      weeklyTotals.nutrients.fat.amount += day.summary.mainNutrients.fat.amount;

      weeklyTotals.progress.totalMealsEaten += day.progress.mealsEaten;
      weeklyTotals.progress.totalMealsPlanned += day.progress.totalMeals;
    });

    // Calculate averages
    if (dailySummaries.length > 0) {
      weeklyTotals.calories.average = weeklyTotals.calories.eaten / dailySummaries.length;
      weeklyTotals.progress.percentage = (weeklyTotals.progress.totalMealsEaten / weeklyTotals.progress.totalMealsPlanned) * 100;
    }

    return {
      period: {
        startDate,
        endDate
      },
      summary: weeklyTotals,
      dailyBreakdown: dailySummaries.map(day => ({
        date: day.date,
        calories: day.summary.calories,
        progress: day.progress
      }))
    };
  }

  calculateMealDistribution(targetCalories: number, distribution: { mealName: string; percentage: number }[]) {
    const mealCalories = distribution.map(meal => ({
      name: meal.mealName,
      targetCalories: Math.round((meal.percentage / 100) * targetCalories),
      percentage: meal.percentage,
      recommendedNutrients: {
        protein: Math.round((meal.percentage / 100) * targetCalories * 0.25 / 4), // 25% from protein
        carbs: Math.round((meal.percentage / 100) * targetCalories * 0.5 / 4),   // 50% from carbs
        fat: Math.round((meal.percentage / 100) * targetCalories * 0.25 / 9)     // 25% from fat
      }
    }));

    return {
      meals: mealCalories,
      summary: {
        totalCalories: targetCalories,
        distribution: mealCalories.map(meal => ({
          name: meal.name,
          calories: meal.targetCalories,
          percentage: meal.percentage,
          macronutrients: {
            protein: {
              grams: meal.recommendedNutrients.protein,
              calories: meal.recommendedNutrients.protein * 4
            },
            carbs: {
              grams: meal.recommendedNutrients.carbs,
              calories: meal.recommendedNutrients.carbs * 4
            },
            fat: {
              grams: meal.recommendedNutrients.fat,
              calories: meal.recommendedNutrients.fat * 9
            }
          }
        }))
      }
    };
  }
} 