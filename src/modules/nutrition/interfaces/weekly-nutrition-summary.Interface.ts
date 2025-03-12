import { DailyNutritionSummary } from './daily-nutrition-summary.interface';

export interface WeeklyNutritionSummary {
  startDate: Date;
  endDate: Date;
  dailySummaries: DailyNutritionSummary[];
  weeklyTotals: {
    totalCalories: number;
    totalProtein: number;
    totalCarbohydrates: number;
    totalFat: number;
    averageDailyCalories: number;
  };
}