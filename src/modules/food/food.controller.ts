import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { FoodSearchDto } from './dto/food-search.dto';

@ApiTags('Food')
@ApiBearerAuth()
@Controller('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search foods in USDA database',
    description: 'Search for foods with pagination support',
  })
  @ApiResponse({ status: 200, description: 'List of foods with pagination' })
  async searchFood(@Query() searchDto: FoodSearchDto) {
    return await this.foodService.searchFoods(
      searchDto.query,
      searchDto.page,
      searchDto.pageSize,
    );
  }

  @Get('details/:fdcId')
  @ApiOperation({
    summary: 'Get food details',
    description: 'Get detailed nutritional information for a specific food',
  })
  @ApiParam({
    name: 'fdcId',
    description: 'USDA Food Data Central ID',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Food details' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  async getFoodDetails(@Param('fdcId') fdcId: string) {
    return await this.foodService.getFoodDetails(fdcId);
  }

  @Post('favorites/:fdcId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add food to favorites',
    description: "Save a food item to user's favorites",
  })
  @ApiParam({
    name: 'fdcId',
    description: 'USDA Food Data Central ID',
    type: String,
  })
  @ApiResponse({ status: 201, description: 'Food added to favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addToFavorites(@Param('fdcId') fdcId: string, @GetUser() user: User) {
    const foodDetails = await this.foodService.getFoodDetails(fdcId);
    return await this.foodService.addToFavorites(foodDetails, user);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get favorite foods',
    description: "Get user's favorite foods with pagination",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page (default: 10)',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'List of favorite foods' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get favorite foods',
    description: "Get user's favorite foods with pagination",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page (default: 10)',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'List of favorite foods' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavorites(
    @GetUser() user: User,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const parsedPage = parseInt(page, 10);
    const parsedPageSize = parseInt(pageSize, 10);
    return await this.foodService.getFavorites(
      user,
      parsedPage,
      parsedPageSize,
    );
  }

  @Delete('favorites/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove food from favorites',
    description: "Remove a food item from user's favorites",
  })
  @ApiParam({
    name: 'id',
    description: 'Favorite food ID',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Food removed from favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  async removeFavorite(@Param('id') id: string, @GetUser() user: User) {
    await this.foodService.removeFavorite(id, user);
    return { message: 'Food removed from favorites' };
  }
}
