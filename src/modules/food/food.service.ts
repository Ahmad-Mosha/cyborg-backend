import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Food } from './entities/food.entity';
import { User } from '../users/entities/user.entity';

interface NutrientValues {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  potassium?: number; // Added for consistency with mapUsdaFoodToEntity
  vitamin_a?: number; // Added for consistency with mapUsdaFoodToEntity
  vitamin_c?: number; // Added for consistency with mapUsdaFoodToEntity
  calcium?: number; // Added for consistency with mapUsdaFoodToEntity
  iron?: number; // Added for consistency with mapUsdaFoodToEntity
}

@Injectable()
export class FoodService {
  async getFoodById(foodId: string): Promise<Food> {
    const food = await this.foodRepository.findOne({
      where: { id: foodId },
    });

    if (!food) {
      throw new HttpException(
        `Food with ID ${foodId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return food;
  }
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

  async searchFoods(query: string, page = 1, pageSize = 10) {
    const endpoint = '/foods/search';
    const params = {
      query,
      pageSize: Math.max(1, pageSize),
      pageNumber: Math.max(0, page - 1),
      dataType: ['Survey (FNDDS)', 'Foundation', 'SR Legacy'].join(','),
      sortBy: 'dataType.keyword',
      sortOrder: 'asc',
    };

    try {
      const data = await this.callUsdaApi(endpoint, params);
      
      if (!data.foods || data.foods.length === 0) {
        return {
          foods: [],
          totalHits: 0,
          currentPage: page,
          totalPages: 0,
        };
      }

      // Map nutrient IDs to their common names
      const nutrientMap = {
        1003: 'protein',
        1004: 'fat',
        1005: 'carbohydrates',
        1008: 'calories', // Already present
        1079: 'fiber',
        1092: 'potassium', // Add potassium mapping
        1093: 'sodium',
        1104: 'vitamin_a', // Add vitamin A mapping (Retinol)
        1106: 'vitamin_a', // Add vitamin A mapping (RAE)
        1162: 'vitamin_c', // Add vitamin C mapping
        1087: 'calcium', // Add calcium mapping
        1089: 'iron', // Add iron mapping
        1253: 'cholesterol',
        2000: 'sugar',
        // 1051: 'water', // Water is usually not displayed directly
      };

      const mappedFoods = await Promise.all(data.foods.map(async (food) => {
        // Get detailed food information for each food
        const detailedFood = await this.callUsdaApi(`/food/${food.fdcId}`);
        
        // Create a nutrient value map
        const nutrientValues: NutrientValues = {};
        detailedFood.foodNutrients?.forEach(nutrient => {
          const nutrientId = nutrient.nutrient?.id || nutrient.nutrientId;
          const nutrientName = nutrientMap[nutrientId];
          if (nutrientName) {
            nutrientValues[nutrientName] = nutrient.amount || 0;
          }
        });

        // Create the food entity data
        const foodData: Partial<Food> = {
          name: detailedFood.description || food.description,
          description: detailedFood.additionalDescriptions || food.additionalDescriptions,
          usdaId: detailedFood.fdcId?.toString(),
          servingSize: 100, // Base serving size
          servingUnit: 'g',
          calories: nutrientValues.calories || 0, // Add calories
          fat: nutrientValues.fat || 0,
          cholesterol: nutrientValues.cholesterol || 0,
          sodium: nutrientValues.sodium || 0,
          potassium: nutrientValues.potassium || 0, // Add potassium
          carbohydrates: nutrientValues.carbohydrates || 0,
          fiber: nutrientValues.fiber || 0,
          sugar: nutrientValues.sugar || 0,
          protein: nutrientValues.protein || 0,
          vitamin_a: nutrientValues.vitamin_a || 0, // Add vitamin A
          vitamin_c: nutrientValues.vitamin_c || 0, // Add vitamin C
          calcium: nutrientValues.calcium || 0, // Add calcium
          iron: nutrientValues.iron || 0, // Add iron
        };

        return foodData;
      }));

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

  private async mapUsdaFoodToEntity(usdaFood: any): Promise<Partial<Food>> {
    const nutrients = usdaFood.foodNutrients || [];
    
    const getNutrientAmount = (ids: number[]) => {
      for (const id of ids) {
        const nutrient = nutrients.find(
          (n) => n.nutrient?.id === id || n.nutrientId === id
        );
        if (nutrient && (nutrient.amount || nutrient.value)) {
          return nutrient.amount || nutrient.value;
        }
      }
      return 0;
    };

    const foodData: Partial<Food> = {
      name: usdaFood.description || usdaFood.foodDescription || '',
      description: usdaFood.additionalDescriptions || '',
      usdaId: (usdaFood.fdcId || usdaFood.fcdId)?.toString(),
      servingSize: 100,
      servingUnit: 'g',
      calories: getNutrientAmount([1008]), // Add calories (Energy)
      fat: getNutrientAmount([1004]), // Total fat
      cholesterol: getNutrientAmount([1253]), // Cholesterol
      sodium: getNutrientAmount([1093]), // Sodium
      potassium: getNutrientAmount([1092]), // Potassium
      carbohydrates: getNutrientAmount([1005]), // Total carbohydrates
      fiber: getNutrientAmount([1079]), // Fiber
      sugar: getNutrientAmount([2000]), // Total sugars
      protein: getNutrientAmount([1003]), // Protein
      vitamin_a: getNutrientAmount([1104, 1106]), // Vitamin A
      vitamin_c: getNutrientAmount([1162]), // Vitamin C
      calcium: getNutrientAmount([1087]), // Calcium
      iron: getNutrientAmount([1089]) // Iron
    };

    return foodData;
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
          calories: true, // Add calories to select
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

  async getFoodByUsdaId(usdaId: string) {
    const food = await this.foodRepository.findOne({
      where: { usdaId: usdaId }
    });

    if (!food) {
      throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
    }

    return food;
  }
}
