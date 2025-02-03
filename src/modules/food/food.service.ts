import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Food } from './entities/food.entity';
import axios from 'axios';

@Injectable()
export class FoodService {
    private readonly apiKey = '9XEMBcroLXuOdBGWfDxFvamWxmskYEKifvE2CvFw';
    private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

constructor(
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
) {}

private async callFoodApi(endpoint: string) {
    try {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Calling API:', url);
    
    const response = await axios.get(url, {
        headers: {
        'X-Api-Key': this.apiKey,
        },
    });
    
    return response.data;
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        
        if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
            throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
        }
        if (error.response?.status === 429) {
            throw new HttpException('API rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    
    throw new HttpException(
        'Failed to fetch data from USDA Food API',
        HttpStatus.INTERNAL_SERVER_ERROR,
    );
    }
}

  // Search foods with various parameters
async searchFood(params: {
    query: string;
    dataType?: string[];
    pageSize?: number;
    pageNumber?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    brandOwner?: string;
}) {
    const {
    query,
    dataType = ['Survey (FNDDS)', 'Foundation', 'SR Legacy'],
    pageSize = 25,
    pageNumber = 1,
    sortBy = 'dataType.keyword',
    sortOrder = 'asc',
    brandOwner,
    } = params;

    const queryParams = new URLSearchParams({
    query: encodeURIComponent(query),
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString(),
    sortBy,
    sortOrder,
    });

    if (dataType.length > 0) {
    queryParams.append('dataType', dataType.join(','));
    }

    if (brandOwner) {
    queryParams.append('brandOwner', brandOwner);
    }

    return this.callFoodApi(`/foods/search?${queryParams.toString()}`);
}

  // Get detailed food information
async getFoodDetails(fdcId: string, format: 'abridged' | 'full' = 'abridged') {
    return this.callFoodApi(`/food/${fdcId}?format=${format}`);
}

  // Get list of foods by multiple FDC IDs
async getFoodsByIds(fdcIds: string[]) {
    try {
    const response = await axios.post(
        `${this.baseUrl}/foods`,
        {
        fdcIds,
        format: 'abridged',
        },
        {
        headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
        },
        },
    );
    return response.data;
    } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new HttpException(
        'Failed to fetch foods by IDs',
        HttpStatus.INTERNAL_SERVER_ERROR,
    );
    }
}

  // Get food nutrients
async getFoodNutrients(fdcId: string) {
    const foodDetails = await this.getFoodDetails(fdcId, 'full');
    return foodDetails.foodNutrients || [];
}

  // Save food to local database
async saveFood(foodData: any): Promise<Food> {
    try {
    const food = this.foodRepository.create({
        fdcId: foodData.fdcId,
        name: foodData.description || foodData.lowercaseDescription,
        description: foodData.additionalDescriptions || '',
        brandOwner: foodData.brandOwner || null,
        nutrients: foodData.foodNutrients || [],
        category: foodData.foodCategory?.description || 'Uncategorized',
        portions: foodData.foodPortions || [],
    });
    
    return await this.foodRepository.save(food);
    } catch (error) {
    throw new HttpException(
        'Failed to save food to database',
        HttpStatus.INTERNAL_SERVER_ERROR,
    );
    }
}

  // Get all saved foods from local database
async getAllSavedFoods() {
    return this.foodRepository.find();
}
}