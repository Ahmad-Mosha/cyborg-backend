import { ApiProperty} from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber, IsEnum, Min, Max, IsBoolean } from 'class-validator';


export enum DietType {
  GLUTEN_FREE = 'gluten free',
  KETOGENIC = 'ketogenic',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  PESCETARIAN = 'pescetarian',
  PALEO = 'paleo',
}

export enum CuisineType {
  AFRICAN = 'african',
  AMERICAN = 'american',
  BRITISH = 'british',
  CHINESE = 'chinese',
  EUROPEAN = 'european',
  FRENCH = 'french',
  INDIAN = 'indian',
  ITALIAN = 'italian',
  JAPANESE = 'japanese',
  KOREAN = 'korean',
  MEXICAN = 'mexican',
  MIDDLE_EASTERN = 'middle eastern',
  THAI = 'thai',
}

export class NutrientDto {
  @ApiProperty({ description: 'Name of the nutrient' })
  name: string;

  @ApiProperty({ description: 'Amount of the nutrient' })
  amount: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;
}

export class RecipeDto {
  @ApiProperty({ description: 'Recipe ID' })
  id: number;

  @ApiProperty({ description: 'Recipe title' })
  title: string;

  @ApiProperty({ description: 'Recipe image URL' })
  image: string;

  @ApiProperty({ description: 'Image type' })
  imageType: string;

  @ApiProperty({ description: 'Number of servings' })
  servings: number;

  @ApiProperty({ description: 'Preparation time in minutes' })
  readyInMinutes: number;

  @ApiProperty({ description: 'License information' })
  license: string;

  @ApiProperty({ description: 'Source name' })
  sourceName: string;

  @ApiProperty({ description: 'Source URL' })
  sourceUrl: string;

  @ApiProperty({ description: 'Spoonacular score' })
  spoonacularScore: number;

  @ApiProperty({ description: 'Health score' })
  healthScore: number;

  @ApiProperty({ description: 'Price per serving' })
  pricePerServing: number;

  @ApiProperty({ description: 'Is the recipe cheap?' })
  cheap: boolean;

  @ApiProperty({ description: 'Is the recipe dairy free?' })
  dairyFree: boolean;

  @ApiProperty({ description: 'Is the recipe gluten free?' })
  glutenFree: boolean;

  @ApiProperty({ description: 'Is the recipe ketogenic?' })
  ketogenic: boolean;

  @ApiProperty({ description: 'Is the recipe vegan?' })
  vegan: boolean;

  @ApiProperty({ description: 'Is the recipe vegetarian?' })
  vegetarian: boolean;

  @ApiProperty({ description: 'Is the recipe very healthy?' })
  veryHealthy: boolean;

  @ApiProperty({ description: 'Is the recipe very popular?' })
  veryPopular: boolean;

  @ApiProperty({ description: 'Is the recipe whole30 compliant?' })
  whole30: boolean;

  @ApiProperty({ type: [NutrientDto], description: 'Nutrient information' })
  nutrients: NutrientDto[];
}

export class SearchRecipeDto {
  @ApiProperty({ required: false, description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ enum: DietType, required: false, description: 'Diet type filter' })
  @IsOptional()
  @IsEnum(DietType)
  diet?: DietType;

  @ApiProperty({ enum: CuisineType, required: false, description: 'Cuisine type filter' })
  @IsOptional()
  @IsEnum(CuisineType)
  cuisine?: CuisineType;

  @ApiProperty({ required: false, minimum: 0, maximum: 1000, description: 'Maximum preparation time in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxReadyTime?: number;

  @ApiProperty({ type: [String], required: false, description: 'Ingredients to include' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeIngredients?: string[];

  @ApiProperty({ type: [String], required: false, description: 'Ingredients to exclude' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeIngredients?: string[];

  @ApiProperty({ required: false, minimum: 0, maximum: 100, description: 'Minimum protein content' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minProtein?: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 100, description: 'Maximum carbohydrates content' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxCarbs?: number;
}

export class IngredientSearchDto {
  @ApiProperty({ required: true, description: 'Search query for ingredients' })
  @IsString()
  query: string;

  @ApiProperty({ required: false, minimum: 1, maximum: 100, default: 10, description: 'Number of results to return' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  number?: number;
}

export class RecipeInstructionsDto {
  @ApiProperty({ description: 'Recipe ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ required: false, description: 'Step breakdown level', default: false })
  @IsOptional()
  @IsBoolean()
  stepBreakdown?: boolean;
}

