import { DailyNutritionSummary } from './daily-nutrition-summary.interface';

export interface WeeklyNutritionSummary {
  startDate: Date;
  endDate: Date;
  dailyData: Array<{
    date: Date;
    calories: {
      target: number;
      eaten: number;
    };
    macroNutrients: {
      protein: number;
      carbs: number;
      fat: number;
    };
    progress: {
      mealsEaten: number;
      totalMeals: number;
      percentage: number;
    };
  }>;
  summary: {
    weeklyTotals: {
      calories: {
        target: number;
        eaten: number;
      };
      protein: number;
      carbohydrates: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
      cholesterol: number;
    };
    averages: {
      calories: {
        target: number;
        eaten: number;
      };
      protein: number;
      carbohydrates: number;
      fat: number;
    };
    macroDistribution: {
      protein: number;
      carbs: number;
      fat: number;
    };
    targetAchieved: number;
  };
}
