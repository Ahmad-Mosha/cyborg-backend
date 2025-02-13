export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  servings: number;
  readyInMinutes: number;
  license: string;
  sourceName: string;
  sourceUrl: string;
  spoonacularScore: number;
  healthScore: number;
  pricePerServing: number;
  cheap: boolean;
  dairyFree: boolean;
  glutenFree: boolean;
  ketogenic: boolean;
  vegan: boolean;
  vegetarian: boolean;
  veryHealthy: boolean;
  veryPopular: boolean;
  whole30: boolean;
  nutrients: Nutrient[];
}