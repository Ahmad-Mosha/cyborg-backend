import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SearchRecipeDto, RecipeAnalysisDto } from './dto/recipe.dto';
import { Recipe } from './interfaces/recipe.interface';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom, throwError } from 'rxjs';

@Injectable()
export class RecipeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.spoonacular.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('SPOONACULAR_API_KEY');
  }

  async searchRecipes(searchDto: SearchRecipeDto) {
    const params = {
      apiKey: this.apiKey,
      query: searchDto.query,
      diet: searchDto.diet,
      cuisine: searchDto.cuisine,
      maxReadyTime: searchDto.maxReadyTime,
      includeIngredients: searchDto.includeIngredients?.join(','),
      excludeIngredients: searchDto.excludeIngredients?.join(','),
      minProtein: searchDto.minProtein,
      maxCarbs: searchDto.maxCarbs,
      addRecipeNutrition: true,
      number: 20,
    };

    try {
      const response = await lastValueFrom(
        this.httpService.get(`${this.baseUrl}/recipes/complexSearch`, { params }).pipe(
          map(res => res.data.results),
          catchError(error => {
            console.error(error);
            return throwError(() => new BadRequestException('Failed to fetch recipes'));
          })
        )
      );

      return this.categorizeRecipes(response);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getRecipeById(id: number) {
    const params = {
      apiKey: this.apiKey,
      addRecipeNutrition: true,
    };

    try {
      return await lastValueFrom(
        this.httpService.get(`${this.baseUrl}/recipes/${id}/information`, { params }).pipe(
          map(res => res.data),
          catchError(error => {
            console.error(error);
            return throwError(() => new BadRequestException(`Failed to fetch recipe with id ${id}`));
          })
        )
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
/**
 * 
 * @param analysisDto  title and ingredient list of the recipe
 * @returns  analysis of the recipe
 * @throws BadRequestException if the request fails
 * bt3mel id = -1 fe moshkla feha 
 * @returns 
 */
  async analyzeRecipe(analysisDto: RecipeAnalysisDto) {
  const params = { apiKey: this.apiKey };

  console.log('Sending request with data:', analysisDto);   

  try {
    return await lastValueFrom(
      this.httpService.post(`${this.baseUrl}/recipes/analyze`, {
        title: analysisDto.title, 
        ingredientList: analysisDto.ingredientList,
        includeNutrition: true,
      }, { params }).pipe(
        map(res => res.data),
        catchError(error => {
          console.error('API Error:', error.response?.data || error.message);
          return throwError(() => new BadRequestException('Failed to analyze recipe'));
        })
      )
    );
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}


  //async getRandomRecipes(tags?: string[]) {
  //const params = {
  //  apiKey: this.apiKey,
  //  number: 10,
  //  tags: tags && tags.length > 0 ? tags.join(',') : undefined, 
  //};

  //console.log('Sending request with params:', params); 

  //try {
  //  return await lastValueFrom(
  //   this.httpService.get(`${this.baseUrl}/recipes/random`, { params }).pipe(
  //      map(res => res.data.recipes),
  //      catchError(error => {
  //        console.error('API Error:', error.response?.data || error.message);
  //        return throwError(() => new BadRequestException('Failed to fetch random recipes'));
  //      })
   //   )
   // );
  //} catch (error) {
   // throw new BadRequestException(error.message);
  //}
//}

/**
 * 
 * @param id id of the recipe
 * @returns  similar recipes to the recipe with the given id
 */
  async getSimilarRecipes(id: number) {
    const params = {
      apiKey: this.apiKey,
      number: 5,
    };

    try {
      return await lastValueFrom(
        this.httpService.get(`${this.baseUrl}/recipes/${id}/similar`, { params }).pipe(
          map(res => res.data),
          catchError(error => {
            console.error(error);
            return throwError(() => new BadRequestException(`Failed to fetch similar recipes for id ${id}`));
          })
        )
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private categorizeRecipes(recipes: Recipe[]) {
    const categories = {
      highProtein: [],
      lowCarb: [],
      vegetarian: [],
      vegan: [],
      glutenFree: [],
      ketogenic: [],
      quickMeals: [],
      budget: [],
    };

    recipes.forEach(recipe => {
      const protein = recipe.nutrients?.find(n => n.name === 'Protein')?.amount || 0;
      const carbs = recipe.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0;

      if (protein >= 20) categories.highProtein.push(recipe);
      if (carbs <= 20) categories.lowCarb.push(recipe);
      if (recipe.vegetarian) categories.vegetarian.push(recipe);
      if (recipe.vegan) categories.vegan.push(recipe);
      if (recipe.glutenFree) categories.glutenFree.push(recipe);
      if (recipe.ketogenic) categories.ketogenic.push(recipe);
      if (recipe.readyInMinutes <= 30) categories.quickMeals.push(recipe);
      if (recipe.cheap) categories.budget.push(recipe);
    });

    return categories;
  }
}
