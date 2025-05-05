/**
 * Entity to define nutritional information columns.
 * This is a utility type for consistent nutrient data across the application.
 */
export class NutrientColumns {
  // Main nutrients
  calories: number = 0;
  protein: number = 0;
  carbohydrates: number = 0;
  fat: number = 0;
  
  // Additional nutrients
  fiber?: number = 0;
  sugar?: number = 0;
  sodium?: number = 0;
  cholesterol?: number = 0;
  potassium?: number = 0;
  vitamin_a?: number = 0;
  vitamin_c?: number = 0;
  calcium?: number = 0;
  iron?: number = 0;
}