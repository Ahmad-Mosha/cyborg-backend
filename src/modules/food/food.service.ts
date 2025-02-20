import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Food } from './entities/food.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FoodService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  constructor(
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('USDA_API_KEY');
  }

  private async callUsdaApi(
    endpoint: string,
    params: Record<string, any> = {},
  ) {
    if (!this.apiKey) {
      throw new HttpException(
        'USDA API key is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: {
          ...params,
          api_key: this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('USDA API Error:', error.response?.data || error.message);
        const status =
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to fetch data from USDA API';
        throw new HttpException(
          { message, error: error.response?.data },
          status,
        );
      }
      throw new HttpException(
        'Failed to fetch data from USDA API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private mapUsdaFoodToEntity(usdaFood: any): Partial<Food> {
    const nutrients = usdaFood.foodNutrients || [];

    const getNutrientAmount = (targetId: number) => {
      // Find nutrient by both nutrientId and id
      const nutrient = nutrients.find(
        (n) =>
          n.nutrientId === targetId ||
          (n.nutrient && n.nutrient.id === targetId),
      );
      // Return either the amount or value property
      return nutrient?.amount || nutrient?.value || 0;
    };

    return {
      name: usdaFood.description || usdaFood.foodDescription || '',
      description: usdaFood.additionalDescriptions || '',
      usdaId: (usdaFood.fdcId || usdaFood.fcdId)?.toString(),
      servingSize: 100,
      servingUnit: 'g',
      fat: getNutrientAmount(1004),
      cholesterol: getNutrientAmount(1253),
      sodium: getNutrientAmount(1093),
      potassium: getNutrientAmount(1092),
      carbohydrates: getNutrientAmount(1005),
      fiber: getNutrientAmount(1079),
      sugar: getNutrientAmount(2000),
      protein: getNutrientAmount(1003),
      vitamin_a: getNutrientAmount(1104),
      vitamin_c: getNutrientAmount(1162),
      calcium: getNutrientAmount(1087),
      iron: getNutrientAmount(1089),
    };
  }

  async searchFoods(query: string, page = 1, pageSize = 10) {
    const endpoint = '/foods/search';
    const params = {
      query,
      pageSize: Math.max(1, pageSize),
      pageNumber: Math.max(0, page - 1),
      dataType: 'Survey (FNDDS), Foundation, SR Legacy',
      sortBy: 'dataType.keyword',
      sortOrder: 'asc',
    };

    try {
      const data = await this.callUsdaApi(endpoint, params);

      // Add debug logging
      console.log(
        'First food item from search:',
        JSON.stringify(data.foods[0], null, 2),
      );
      console.log(
        'First few nutrients:',
        JSON.stringify(data.foods[0]?.foodNutrients?.slice(0, 3), null, 2),
      );

      const mappedFoods = data.foods.map((food: any) => {
        // Use the same mapping function for consistency
        return this.mapUsdaFoodToEntity(food);
      });

      return {
        foods: mappedFoods,
        totalHits: data.totalHits,
        currentPage: data.currentPage + 1,
        totalPages: Math.ceil(data.totalHits / pageSize),
      };
    } catch (error) {
      console.error('Search foods error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch data from USDA API',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getFoodDetails(fdcId: string) {
    const response = await this.callUsdaApi(`/food/${fdcId}`);
    return this.mapUsdaFoodToEntity(response);
  }

  async addToFavorites(foodData: Partial<Food>, user: User): Promise<Food> {
    try {
      // Check if food already exists in user's favorites
      const existingFood = await this.foodRepository.findOne({
        where: {
          usdaId: foodData.usdaId,
          user: { id: user.id },
        },
      });

      if (existingFood) {
        throw new HttpException(
          'Food already exists in favorites',
          HttpStatus.CONFLICT,
        );
      }

      // If food doesn't exist, proceed with adding it
      let completeFood: Partial<Food>;
      if (foodData.usdaId) {
        completeFood = await this.getFoodDetails(foodData.usdaId);
      } else {
        completeFood = foodData;
      }

      const foodToSave = this.foodRepository.create({
        ...completeFood,
        user: { id: user.id },
      });

      return await this.foodRepository.save(foodToSave);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error in addToFavorites:', error);
      throw new HttpException(
        'Failed to add food to favorites',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFavorites(user: User, page: number = 1, pageSize: number = 10) {
    // Ensure page and pageSize are numbers
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    try {
      const [foods, total] = await this.foodRepository.findAndCount({
        where: { user: { id: user.id } },
        select: {
          id: true,
          name: true,
          description: true,
          fat: true,
          cholesterol: true,
          sodium: true,
          potassium: true,
          carbohydrates: true,
          fiber: true,
          sugar: true,
          protein: true,
          vitamin_a: true,
          vitamin_c: true,
          calcium: true,
          iron: true,
          servingSize: true,
          servingUnit: true,
          usdaId: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take,
        order: { createdAt: 'DESC' },
      });

      return {
        data: foods,
        meta: {
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      console.error('Error in getFavorites:', error);
      throw new HttpException(
        'Failed to fetch favorites',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeFavorite(id: string, user: User): Promise<void> {
    const result = await this.foodRepository.delete({
      id,
      user: { id: user.id },
    });

    if (result.affected === 0) {
      throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
    }
  }
}
