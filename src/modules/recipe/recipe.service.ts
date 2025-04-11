import { Injectable, BadRequestException} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SearchRecipeDto, IngredientSearchDto } from './dto/recipe.dto';
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

  async searchIngredients(searchDto: IngredientSearchDto) {
    const params = {
      apiKey: this.apiKey,
      query: searchDto.query,
      number: searchDto.number || 10,
    };

    try {
      return await lastValueFrom(
        this.httpService.get(`${this.baseUrl}/food/ingredients/search`, { params }).pipe(
          map(res => res.data),
          catchError(error => {
            console.error(error);
            return throwError(() => new BadRequestException('Failed to search ingredients'));
          })
        )
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  
  async getRecipeNutrition(id: number) {
    const params = {
      apiKey: this.apiKey,
    };

    try {
      return await lastValueFrom(
        this.httpService.get(`${this.baseUrl}/recipes/${id}/nutritionWidget.json`, { params }).pipe(
          map(res => res.data),
          catchError(error => {
            console.error(error);
            return throwError(() => new BadRequestException(`Failed to fetch nutrition information for recipe ${id}`));
          })
        )
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

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

  async getAnalyzedInstructions(id: number, stepBreakdown: boolean = false) {
    const params = {
      apiKey: this.apiKey,
      stepBreakdown: stepBreakdown,
    };

    try {
      return await lastValueFrom(
        this.httpService.get(`${this.baseUrl}/recipes/${id}/analyzedInstructions`, { params }).pipe(
          map(res => res.data),
          catchError(error => {
            console.error('API Error:', error.response?.data || error.message);
            return throwError(() => new BadRequestException(`Failed to fetch recipe instructions for id ${id}`));
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
// scan food image by URL or file upload 
// using the Spoonacular API

async analyzeImageByUrl(imageUrl: string) {
  const params = {
    apiKey: this.apiKey,
    imageUrl: imageUrl,
  };

  try {
    return await lastValueFrom(
      this.httpService.get(`${this.baseUrl}/food/images/analyze`, { params }).pipe(
        map(res => res.data),
        catchError(error => {
          console.error('API Error:', error.response?.data || error.message);
          return throwError(() => new BadRequestException('Failed to analyze food image by URL'));
        })
      )
    );
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}

async analyzeImageByFile(file: Buffer) {
  const formData = new FormData();
  formData.append('file', new Blob([file]), 'food.jpg');

  const headers = {
    'Content-Type': 'multipart/form-data',
  };

  const params = {
    apiKey: this.apiKey,
  };

  try {
    return await lastValueFrom(
      this.httpService.post(`${this.baseUrl}/food/images/analyze`, formData, { 
        params, 
        headers 
      }).pipe(
        map(res => res.data),
        catchError(error => {
          console.error('API Error:', error.response?.data || error.message);
          return throwError(() => new BadRequestException('Failed to analyze food image file'));
        })
      )
    );
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}

}