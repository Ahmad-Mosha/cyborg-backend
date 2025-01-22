import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NutritionService } from './nutrition.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { CreateMealDto } from './dto/create-meal.dto';

@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  // Food Endpoints
  @Post('foods')
  async createFood(@Request() req, @Body() createFoodDto: CreateFoodDto) {
    return await this.nutritionService.createFood(req.user, createFoodDto);
  }

  @Get('foods/search')
  async searchFoods(@Query('query') query: string) {
    return await this.nutritionService.searchFoods(query);
  }

  @Get('foods/:id')
  async getFood(@Param('id') id: string) {
    return await this.nutritionService.getFood(id);
  }

  // Meal Endpoints
  @Post('meals')
  async createMeal(@Request() req, @Body() createMealDto: CreateMealDto) {
    return await this.nutritionService.createMeal(req.user, createMealDto);
  }

  @Get('meals')
  async getUserMeals(
    @Request() req,
    @Query('date') date: string = new Date().toISOString(),
  ) {
    return await this.nutritionService.getUserMeals(req.user, new Date(date));
  }

  @Get('daily-nutrition')
  async getDailyNutrition(
    @Request() req,
    @Query('date') date: string = new Date().toISOString(),
  ) {
    return await this.nutritionService.getDailyNutrition(
      req.user,
      new Date(date),
    );
  }

  @Delete('meals/:id')
  async deleteMeal(@Request() req, @Param('id') id: string) {
    return await this.nutritionService.deleteMeal(req.user, id);
  }
}
