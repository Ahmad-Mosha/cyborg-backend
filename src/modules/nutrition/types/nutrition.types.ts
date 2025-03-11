export type NutrientCalculation = {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

export interface MealNutrition extends NutrientCalculation {
  mealId: string;
  foods: FoodNutrition[];
}

export interface FoodNutrition extends NutrientCalculation {
  foodId: string;
  servingSize: number;
  servingUnit: string;
} 