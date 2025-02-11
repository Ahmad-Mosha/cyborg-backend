import { IsOptional, IsString, IsArray, IsNumber, IsEnum, Min, Max } from 'class-validator';

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

export class SearchRecipeDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(DietType)
  diet?: DietType;

  @IsOptional()
  @IsEnum(CuisineType)
  cuisine?: CuisineType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxReadyTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeIngredients?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeIngredients?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minProtein?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxCarbs?: number;
}

export class RecipeAnalysisDto {
  @IsString()
  title: string;
  
  @IsString()
  ingredientList: string;
}