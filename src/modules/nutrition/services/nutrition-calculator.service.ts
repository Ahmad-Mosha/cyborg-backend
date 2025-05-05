import { Injectable } from '@nestjs/common';
import { Food } from '../../food/entities/food.entity';
import { Meal } from '../entities/meal.entity';
import { MealFood } from '../entities/meal-food.entity';
import { NutrientColumns } from '../entities/embedded/nutrient-columns.entity';
import { DailyNutritionSummary } from '../interfaces/daily-nutrition-summary.interface';
import { WeeklyNutritionSummary } from '../interfaces/weekly-nutrition-summary.interface';

@Injectable()
export class NutritionCalculatorService {
  calculateNutrients(food: Food, servingSize: number): NutrientColumns {
    const ratio = servingSize / (food.servingSize || 100);

    return {
      calories: food.calories ? food.calories * ratio : 0,
      protein: food.protein ? food.protein * ratio : 0,
      carbohydrates: food.carbohydrates ? food.carbohydrates * ratio : 0,
      fat: food.fat ? food.fat * ratio : 0,
      fiber: food.fiber ? food.fiber * ratio : 0,
      sugar: food.sugar ? food.sugar * ratio : 0,
      sodium: food.sodium ? food.sodium * ratio : 0,
      cholesterol: food.cholesterol ? food.cholesterol * ratio : 0,
    };
  }

  calculateMealNutrition(meal: Meal) {
    if (!meal || !meal.mealFoods || meal.mealFoods.length === 0) {
      return {
        totalNutrients: {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          cholesterol: 0,
        },
        foods: [],
        eaten: meal?.eaten || false,
        eatenAt: meal?.eatenAt || null,
      };
    }

    const totalNutrients = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    // Calculate total nutrients from all meal foods
    const foods = meal.mealFoods.map((mealFood) => {
      // Initialize nutrients as a NutrientColumns object with default values
      const nutrients: NutrientColumns = mealFood.nutrients || {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
      };

      // Add to totals
      totalNutrients.calories += nutrients.calories || 0;
      totalNutrients.protein += nutrients.protein || 0;
      totalNutrients.carbohydrates += nutrients.carbohydrates || 0;
      totalNutrients.fat += nutrients.fat || 0;
      totalNutrients.fiber += nutrients.fiber || 0;
      totalNutrients.sugar += nutrients.sugar || 0;
      totalNutrients.sodium += nutrients.sodium || 0;
      totalNutrients.cholesterol += nutrients.cholesterol || 0;

      // Return food info with nutrients
      return {
        id: mealFood.id,
        foodId: mealFood.food?.id,
        name: mealFood.food?.name || 'Unknown Food',
        servingSize: mealFood.servingSize,
        servingUnit: mealFood.servingUnit,
        nutrients: nutrients,
      };
    });

    return {
      totalNutrients,
      foods,
      eaten: meal.eaten || false,
      eatenAt: meal.eatenAt || null,
    };
  }

  async calculateDailyNutrition(
    date: Date,
    meals: Meal[],
  ): Promise<DailyNutritionSummary> {
    // Set up totals and summaries
    const totalNutrients = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    const mealsEaten = meals.filter((meal) => meal.eaten).length;
    const mealsData = [];
    const mealDistribution = [];

    // Process each meal
    for (const meal of meals) {
      const mealNutrition = this.calculateMealNutrition(meal);

      // Only count nutrients from eaten meals
      if (meal.eaten) {
        totalNutrients.calories += mealNutrition.totalNutrients.calories;
        totalNutrients.protein += mealNutrition.totalNutrients.protein;
        totalNutrients.carbohydrates +=
          mealNutrition.totalNutrients.carbohydrates;
        totalNutrients.fat += mealNutrition.totalNutrients.fat;
        totalNutrients.fiber += mealNutrition.totalNutrients.fiber;
        totalNutrients.sugar += mealNutrition.totalNutrients.sugar;
        totalNutrients.sodium += mealNutrition.totalNutrients.sodium;
        totalNutrients.cholesterol += mealNutrition.totalNutrients.cholesterol;
      }

      // Add to meal distribution
      mealDistribution.push({
        mealId: meal.id,
        name: meal.name,
        targetTime: meal.targetTime,
        targetCalories: meal.targetCalories,
        actualCalories: mealNutrition.totalNutrients.calories,
        eaten: meal.eaten,
        eatenAt: meal.eatenAt,
      });

      // Add to meals data
      mealsData.push({
        id: meal.id,
        name: meal.name,
        targetTime: meal.targetTime,
        totalNutrients: mealNutrition.totalNutrients,
        foods: mealNutrition.foods,
        eaten: meal.eaten,
        eatenAt: meal.eatenAt,
      });
    }

    // Calculate target calories from meal plan
    let targetCalories = 0;
    if (meals.length > 0 && meals[0].mealPlan) {
      targetCalories = meals[0].mealPlan.targetCalories || 0;
    }

    // Calculate macronutrient percentages
    const totalCaloriesFromMacros =
      totalNutrients.protein * 4 +
      totalNutrients.carbohydrates * 4 +
      totalNutrients.fat * 9;

    const proteinPercentage =
      totalCaloriesFromMacros > 0
        ? (totalNutrients.protein * 4) / totalCaloriesFromMacros
        : 0;
    const carbsPercentage =
      totalCaloriesFromMacros > 0
        ? (totalNutrients.carbohydrates * 4) / totalCaloriesFromMacros
        : 0;
    const fatPercentage =
      totalCaloriesFromMacros > 0
        ? (totalNutrients.fat * 9) / totalCaloriesFromMacros
        : 0;

    // Compile the summary
    return {
      date: date,
      summary: {
        calories: {
          target: targetCalories,
          eaten: totalNutrients.calories,
          remaining: Math.max(0, targetCalories - totalNutrients.calories),
        },
        mainNutrients: {
          protein: {
            amount: totalNutrients.protein,
            unit: 'g',
            percentage: Math.round(proteinPercentage * 100),
          },
          carbs: {
            amount: totalNutrients.carbohydrates,
            unit: 'g',
            percentage: Math.round(carbsPercentage * 100),
          },
          fat: {
            amount: totalNutrients.fat,
            unit: 'g',
            percentage: Math.round(fatPercentage * 100),
          },
        },
        additionalNutrients: {
          fiber: {
            amount: totalNutrients.fiber,
            unit: 'g',
          },
          sugar: {
            amount: totalNutrients.sugar,
            unit: 'g',
          },
          sodium: {
            amount: totalNutrients.sodium,
            unit: 'mg',
          },
          cholesterol: {
            amount: totalNutrients.cholesterol,
            unit: 'mg',
          },
        },
      },
      meals: mealsData,
      progress: {
        mealsEaten: mealsEaten,
        totalMeals: meals.length,
        percentage:
          meals.length > 0 ? Math.round((mealsEaten / meals.length) * 100) : 0,
      },
      mealDistribution: mealDistribution,
    };
  }

  calculateWeeklyNutrition(
    startDate: Date,
    endDate: Date,
    dailySummaries: DailyNutritionSummary[],
  ): WeeklyNutritionSummary {
    // Initialize totals for the week
    const weeklyTotals = {
      calories: {
        target: 0,
        eaten: 0,
      },
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    };

    const dailyData = [];

    // Process each day's summary
    for (const daily of dailySummaries) {
      // Add to weekly totals
      weeklyTotals.calories.target += daily.summary.calories.target;
      weeklyTotals.calories.eaten += daily.summary.calories.eaten;
      weeklyTotals.protein += daily.summary.mainNutrients.protein.amount;
      weeklyTotals.carbohydrates += daily.summary.mainNutrients.carbs.amount;
      weeklyTotals.fat += daily.summary.mainNutrients.fat.amount;
      weeklyTotals.fiber += daily.summary.additionalNutrients.fiber.amount;
      weeklyTotals.sugar += daily.summary.additionalNutrients.sugar.amount;
      weeklyTotals.sodium += daily.summary.additionalNutrients.sodium.amount;
      weeklyTotals.cholesterol +=
        daily.summary.additionalNutrients.cholesterol.amount;

      // Add to daily data array
      dailyData.push({
        date: daily.date,
        calories: {
          target: daily.summary.calories.target,
          eaten: daily.summary.calories.eaten,
        },
        macroNutrients: {
          protein: daily.summary.mainNutrients.protein.amount,
          carbs: daily.summary.mainNutrients.carbs.amount,
          fat: daily.summary.mainNutrients.fat.amount,
        },
        progress: daily.progress,
      });
    }

    // Calculate averages (avoid division by zero)
    const daysCount = Math.max(1, dailySummaries.length);
    const averages = {
      calories: {
        target: weeklyTotals.calories.target / daysCount,
        eaten: weeklyTotals.calories.eaten / daysCount,
      },
      protein: weeklyTotals.protein / daysCount,
      carbohydrates: weeklyTotals.carbohydrates / daysCount,
      fat: weeklyTotals.fat / daysCount,
    };

    // Calculate caloric distribution percentages
    const totalCaloriesFromMacros =
      weeklyTotals.protein * 4 +
      weeklyTotals.carbohydrates * 4 +
      weeklyTotals.fat * 9;

    const macroDistribution = {
      protein:
        totalCaloriesFromMacros > 0
          ? (weeklyTotals.protein * 4) / totalCaloriesFromMacros
          : 0,
      carbs:
        totalCaloriesFromMacros > 0
          ? (weeklyTotals.carbohydrates * 4) / totalCaloriesFromMacros
          : 0,
      fat:
        totalCaloriesFromMacros > 0
          ? (weeklyTotals.fat * 9) / totalCaloriesFromMacros
          : 0,
    };

    // Calculate percentage of target achieved
    const targetAchieved =
      weeklyTotals.calories.target > 0
        ? weeklyTotals.calories.eaten / weeklyTotals.calories.target
        : 0;

    // Create the weekly summary with the correct interface
    return {
      startDate,
      endDate,
      dailyData,
      summary: {
        weeklyTotals,
        averages,
        macroDistribution: {
          protein: Math.round(macroDistribution.protein * 100),
          carbs: Math.round(macroDistribution.carbs * 100),
          fat: Math.round(macroDistribution.fat * 100),
        },
        targetAchieved: Math.round(targetAchieved * 100),
      },
    };
  }
}
