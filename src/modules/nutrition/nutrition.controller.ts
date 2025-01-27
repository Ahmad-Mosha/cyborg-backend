import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
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
  async createFood(
    @GetUser() user: User,
    @Body() createFoodDto: CreateFoodDto,
  ) {
    return await this.nutritionService.createFood(user, createFoodDto);
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
  async createMeal(
    @GetUser() user: User,
    @Body() createMealDto: CreateMealDto,
  ) {
    return await this.nutritionService.createMeal(user, createMealDto);
  }

  @Get('meals')
  async getUserMeals(
    @GetUser() user: User,
    @Query('date') date: string = new Date().toISOString(),
  ) {
    return await this.nutritionService.getUserMeals(user, new Date(date));
  }

  @Get('daily-nutrition')
  async getDailyNutrition(
    @GetUser() user: User,
    @Query('date') date: string = new Date().toISOString(),
  ) {
    return await this.nutritionService.getDailyNutrition(user, new Date(date));
  }

  @Delete('meals/:id')
  async deleteMeal(@GetUser() user: User, @Param('id') id: string) {
    return await this.nutritionService.deleteMeal(user, id);
  }
}
