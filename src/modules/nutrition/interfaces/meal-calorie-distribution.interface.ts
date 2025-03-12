export interface MealCalorieDistribution {
  mealName: string;
  percentage: number;  // percentage of total daily calories
  calorieAmount?: number;  // calculated value (optional)
}