import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { FoodService } from './food.service';

@Controller('food')
export class FoodController {
    constructor(private readonly foodService: FoodService) {}

@Get('search')
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
async getFoodDetails(
    @Param('fdcId') fdcId: string,
    @Query('format') format?: 'abridged' | 'full',
) {
    return await this.foodService.getFoodDetails(fdcId, format);
}

@Post('bulk')
async getFoodsByIds(@Body() body: { fdcIds: string[] }) {
    return await this.foodService.getFoodsByIds(body.fdcIds);
}

@Get(':fdcId/nutrients')
async getFoodNutrients(@Param('fdcId') fdcId: string) {
    return await this.foodService.getFoodNutrients(fdcId);
}

@Get('saved')
async getAllSavedFoods() {
    return await this.foodService.getAllSavedFoods();
}
}
