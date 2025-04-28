import { Injectable, BadRequestException} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SearchRecipeDto, IngredientSearchDto } from './dto/recipe.dto';
import { Recipe } from './interfaces/recipe.interface';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom, throwError } from 'rxjs';
import { UploadService } from '@modules/upload/upload.service';

@Injectable()
export class RecipeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.spoonacular.com';
  s3Service: any;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
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

async analyzeImageByFile(file: Express.Multer.File) {
    try {
      // 1. Upload file to S3
      const s3Url = await this.s3Service.uploadFile(
        file.buffer,
        file.mimetype
      );

      // 2. Call Spoonacular API with the S3 URL
      const params = {
        apiKey: this.apiKey,
        imageUrl: s3Url,
      };

      const analysisResult = await lastValueFrom(
        this.httpService.get(`${this.baseUrl}/food/images/analyze`, { params }).pipe(
          map(res => {
            // Add the S3 URL to the response
            return { ...res.data, imageUrl: s3Url };
          }),
          catchError(error => {
            console.error('API Error:', error.response?.data || error.message);
            // Try to delete the uploaded file in case of error
            this.s3Service.deleteFile(s3Url).catch(deleteErr => {
              console.error('Failed to delete S3 file:', deleteErr);
            });
            return throwError(() => new BadRequestException('Failed to analyze food image file'));
          })
        )
      );

      return analysisResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

async searchGroceryProductByUpc(upc: string) {
  const params = {
    apiKey: this.apiKey,
    upc: upc,
  };

  try {
    return await lastValueFrom(
      this.httpService.get(`${this.baseUrl}/food/products/upc/${upc}`, { params }).pipe(
        map(res => res.data),
        catchError(error => {
          console.error('API Error:', error.response?.data || error.message);
          return throwError(() => new BadRequestException(`Failed to find grocery product with UPC ${upc}`));
        })
      )
    );
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}

}