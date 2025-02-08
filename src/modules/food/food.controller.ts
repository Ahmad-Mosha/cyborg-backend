import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FoodService } from './food.service';

@ApiTags('Food')
@Controller('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search food items',
    description: 'Search for food items with various filtering options',
  })
  @ApiQuery({
    name: 'query',
    description: 'Search query string',
    required: true,
  })
  @ApiQuery({
    name: 'pageSize',
    description: 'Number of items per page',
    required: false,
  })
  @ApiQuery({ name: 'pageNumber', description: 'Page number', required: false })
  @ApiQuery({
    name: 'sortBy',
    description: 'Field to sort by',
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    enum: ['asc', 'desc'],
    description: 'Sort order',
    required: false,
  })
  @ApiQuery({
    name: 'brandOwner',
    description: 'Filter by brand owner',
    required: false,
  })
  @ApiQuery({
    name: 'dataType',
    description: 'Filter by data type(s)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of food items matching the search criteria',
  })
  async searchFood(
    @Query('query') query: string,
    @Query('pageSize') pageSize?: number,
    @Query('pageNumber') pageNumber?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('brandOwner') brandOwner?: string,
    @Query('dataType') dataType?: string,
  ) {
    return await this.foodService.searchFood({
      query,
      pageSize,
      pageNumber,
      sortBy,
      sortOrder,
      brandOwner,
      dataType: dataType ? dataType.split(',') : undefined,
    });
  }

  @Get('details/:fdcId')
  @ApiOperation({
    summary: 'Get food details',
    description: 'Get detailed information about a specific food item',
  })
  @ApiParam({ name: 'fdcId', description: 'Food Data Central ID' })
  @ApiQuery({
    name: 'format',
    enum: ['abridged', 'full'],
    description: 'Response format type',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Food item details' })
  @ApiResponse({ status: 404, description: 'Food item not found' })
  async getFoodDetails(
    @Param('fdcId') fdcId: string,
    @Query('format') format?: 'abridged' | 'full',
  ) {
    return await this.foodService.getFoodDetails(fdcId, format);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Get multiple food items',
    description: 'Retrieve multiple food items by their IDs',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fdcIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of Food Data Central IDs',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'List of food items' })
  async getFoodsByIds(@Body() body: { fdcIds: string[] }) {
    return await this.foodService.getFoodsByIds(body.fdcIds);
  }

  @Get(':fdcId/nutrients')
  @ApiOperation({
    summary: 'Get food nutrients',
    description: 'Get nutritional information for a specific food item',
  })
  @ApiParam({ name: 'fdcId', description: 'Food Data Central ID' })
  @ApiResponse({ status: 200, description: 'Food nutrient information' })
  @ApiResponse({ status: 404, description: 'Food item not found' })
  async getFoodNutrients(@Param('fdcId') fdcId: string) {
    return await this.foodService.getFoodNutrients(fdcId);
  }

  @Get('saved')
  @ApiOperation({
    summary: 'Get saved foods',
    description: 'Get list of all saved/favorite food items',
  })
  @ApiResponse({ status: 200, description: 'List of saved food items' })
  async getAllSavedFoods() {
    return await this.foodService.getAllSavedFoods();
  }
}
