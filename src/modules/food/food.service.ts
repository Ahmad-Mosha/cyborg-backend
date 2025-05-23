import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Food } from './entities/food.entity';
import { User } from '../users/entities/user.entity';
import { CreateCustomFoodDto } from './dto/create-custom-food.dto';

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
      // Request nutrients in the search response to avoid additional API calls
      nutrients: [
        1003, 1004, 1005, 1008, 1079, 1092, 1093, 1104, 1162, 1087, 1089, 1253,
        2000,
      ].join(','),
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
        1008: 'calories',
        1079: 'fiber',
        1092: 'potassium',
        1093: 'sodium',
        1104: 'vitamin_a',
        1106: 'vitamin_a',
        1162: 'vitamin_c',
        1087: 'calcium',
        1089: 'iron',
        1253: 'cholesterol',
        2000: 'sugar',
      };

      // Process foods in batches to improve performance
      const mappedFoods = data.foods.map((food) => {
        // Extract nutrients from the food data directly
        const nutrients = food.foodNutrients || [];
        const nutrientValues = {};

        nutrients.forEach((nutrient) => {
          const nutrientId =
            nutrient.nutrientId || (nutrient.nutrient && nutrient.nutrient.id);
          const nutrientName = nutrientMap[nutrientId];
          if (nutrientName) {
            nutrientValues[nutrientName] =
              nutrient.value || nutrient.amount || 0;
          }
        });

        // Create the food entity data
        const foodData = {
          name: food.description || '',
          description: food.additionalDescriptions || '',
          usdaId: food.fdcId?.toString() || '',
          servingSize: 100, // Base serving size
          servingUnit: 'g',
          calories: nutrientValues['calories'] || 0,
          fat: nutrientValues['fat'] || 0,
          cholesterol: nutrientValues['cholesterol'] || 0,
          sodium: nutrientValues['sodium'] || 0,
          potassium: nutrientValues['potassium'] || 0,
          carbohydrates: nutrientValues['carbohydrates'] || 0,
          fiber: nutrientValues['fiber'] || 0,
          sugar: nutrientValues['sugar'] || 0,
          protein: nutrientValues['protein'] || 0,
          vitamin_a: nutrientValues['vitamin_a'] || 0,
          vitamin_c: nutrientValues['vitamin_c'] || 0,
          calcium: nutrientValues['calcium'] || 0,
          iron: nutrientValues['iron'] || 0,
        };

        return foodData;
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

  private async mapUsdaFoodToEntity(usdaFood: any): Promise<Partial<Food>> {
    const nutrients = usdaFood.foodNutrients || [];

    const getNutrientAmount = (ids: number[]) => {
      for (const id of ids) {
        const nutrient = nutrients.find(
          (n) => n.nutrient?.id === id || n.nutrientId === id,
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
      iron: getNutrientAmount([1089]), // Iron
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
      where: { usdaId: usdaId },
    });

    if (!food) {
      throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
    }

    return food;
  }

  async createCustomFood(dto: CreateCustomFoodDto, user: User): Promise<Food> {
    try {
      const customFood = this.foodRepository.create({
        ...dto,
        isCustom: true,
        user: { id: user.id },
        servingSize: dto.servingSize || 100,
        servingUnit: dto.servingUnit || 'g',
      });

      return await this.foodRepository.save(customFood);
    } catch (error) {
      console.error('Error in createCustomFood:', error);
      throw new HttpException(
        'Failed to create custom food',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserFoods(
    user: User,
    page: number = 1,
    pageSize: number = 10,
    isCustomOnly: boolean = false,
  ) {
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    try {
      const query = this.foodRepository
        .createQueryBuilder('food')
        .where('food.user.id = :userId', { userId: user.id });

      if (isCustomOnly) {
        query.andWhere('food.isCustom = :isCustom', { isCustom: true });
      }

      const [foods, total] = await query
        .skip(skip)
        .take(take)
        .orderBy('food.createdAt', 'DESC')
        .getManyAndCount();

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
      console.error('Error in getUserFoods:', error);
      throw new HttpException(
        'Failed to fetch user foods',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a food item from provided data
   * This method supports both custom foods and foods from external sources
   */
  async createFood(foodData: Partial<Food>, user: User): Promise<Food> {
    try {
      // Set defaults for missing values
      const foodToSave = this.foodRepository.create({
        ...foodData,
        servingSize: foodData.servingSize || 100,
        servingUnit: foodData.servingUnit || 'g',
        user: { id: user.id },
        // Set nutrition fields to 0 if not provided
        calories: foodData.calories || 0,
        protein: foodData.protein || 0,
        carbohydrates: foodData.carbohydrates || 0,
        fat: foodData.fat || 0,
        fiber: foodData.fiber || 0,
        sugar: foodData.sugar || 0,
        sodium: foodData.sodium || 0,
        cholesterol: foodData.cholesterol || 0
      });

      return await this.foodRepository.save(foodToSave);
    } catch (error) {
      console.error('Error in createFood:', error);
      throw new HttpException(
        'Failed to create food item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
