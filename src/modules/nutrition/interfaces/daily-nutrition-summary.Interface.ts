export interface NutrientInfo {
  amount: number;
  unit: string;
  percentage?: number;
}

export interface SimplifiedMeal {
  id: string;
  name: string;
  time: string;
  status: 'eaten' | 'not_eaten';
  calories: {
    target: number;
    actual: number;
  };
  foods: {
    name: string;
    amount: string;
    calories: number;
    eaten: boolean;
  }[];
}

export interface MealDistributionItem {
  mealName: string;
  targetCalories: number;
  actualCalories: number;
  percentage: number;
  deficit: number;
  nutrients: {
    protein: {
      grams: number;
      calories: number;
    };
    carbs: {
      grams: number;
      calories: number;
    };
    fat: {
      grams: number;
      calories: number;
    };
  };
}

export interface DailyNutritionSummary {
  date: Date;
  summary: {
    calories: {
      target: number;
      eaten: number;
      remaining: number;
    };
    mainNutrients: {
      protein: NutrientInfo;
      carbs: NutrientInfo;
      fat: NutrientInfo;
    };
    additionalNutrients?: {
      fiber: NutrientInfo;
      sugar: NutrientInfo;
      sodium: NutrientInfo;
      cholesterol: NutrientInfo;
    };
  };
  meals: SimplifiedMeal[];
  progress: {
    mealsEaten: number;
    totalMeals: number;
    percentage: number;
  };
  mealDistribution: MealDistributionItem[];
}