import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  ParseUUIDPipe,
  Request,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MealPlanService } from './services/meal-plan.service';
import { MealService } from './services/meal.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import { AddMealDto } from './dto/add-meal.dto';
import { AddFoodToMealDto } from './dto/add-food-to-meal.dto';
import { MealPlan } from './entities/meal-plan.entity';
import { Meal } from './entities/meal.entity';
import { MealFood } from './entities/meal-food.entity';
import { DailyNutritionSummary } from './interfaces/daily-nutrition-summary.interface';
import { DuplicateMealsDto } from './dto/duplicate-meals.dto';
import { NutritionCalculatorService } from './services/nutrition-calculator.service';
import { MarkFoodEatenDto } from './dto/mark-foodEaten.dto';

@ApiTags('Nutrition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition')
export class NutritionController {
  private readonly logger = new Logger(NutritionController.name);

  constructor(
    private readonly mealPlanService: MealPlanService,
    private readonly mealService: MealService,
    private readonly nutritionCalculator: NutritionCalculatorService
  ) {}

  @Post('meal-plans')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Create a new meal plan' })
  async createMealPlan(
    @Body() dto: CreateMealPlanDto,
    @Request() req
  ): Promise<MealPlan> {
    return this.mealPlanService.createMealPlan(dto, req.user);
  }

  @Get('meal-plans')
  @ApiOperation({ summary: 'Get all meal plans for current user with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getMealPlans(
    @Request() req,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    return this.mealPlanService.getMealPlans(req.user, page, pageSize);
  }

  @Get('meal-plans/:id')
  @ApiOperation({ summary: 'Get a meal plan by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Meal plan ID' })
  @ApiOkResponse({ description: 'Returns the meal plan', type: MealPlan })
  @ApiNotFoundResponse({ description: 'Meal plan not found' })
  async getMealPlanById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ): Promise<MealPlan> {
    return this.mealPlanService.getMealPlanById(id, req.user);
  }

  @Put('meal-plans/:id')
  @ApiOperation({ summary: 'Update a meal plan' })
  @ApiParam({ name: 'id', type: String, description: 'Meal plan ID' })
  @ApiBody({ type: UpdateMealPlanDto })
  @ApiOkResponse({ description: 'Meal plan updated successfully', type: MealPlan })
  @ApiNotFoundResponse({ description: 'Meal plan not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateMealPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMealPlanDto: UpdateMealPlanDto,
    @Request() req
  ): Promise<MealPlan> {
    return this.mealPlanService.updateMealPlan(id, updateMealPlanDto, req.user);
  }

  @Delete('meal-plans/:id')
  @ApiOperation({ summary: 'Delete a meal plan' })
  @ApiParam({ name: 'id', type: String, description: 'Meal plan ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Meal plan deleted successfully' })
  @ApiNotFoundResponse({ description: 'Meal plan not found' })
  async deleteMealPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ): Promise<void> {
    return this.mealPlanService.deleteMealPlan(id, req.user);
  }

  @Post('meal-plans/:id/meals')
  @ApiOperation({ summary: 'Add a meal to a meal plan' })
  @ApiParam({ name: 'id', type: String, description: 'Meal plan ID' })
  @ApiBody({ type: AddMealDto })
  @ApiCreatedResponse({ description: 'Meal added successfully', type: Meal })
  @ApiNotFoundResponse({ description: 'Meal plan not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async addMealToMealPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addMealDto: AddMealDto,
    @Request() req
  ): Promise<Meal> {
    return this.mealService.addMealToMealPlan(id, addMealDto, req.user);
  }

  @Get('meals/:id')
  @ApiOperation({ summary: 'Get meal by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Returns the meal', type: Meal })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  async getMealById(
    @Param('id') id: string,
    @Request() req
  ): Promise<Meal> {
    return this.mealService.getMealById(id, req.user);
  }

  @Post('meals/:id/foods')
  @ApiOperation({ summary: 'Add food to meal' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AddFoodToMealDto })
  @ApiCreatedResponse({ description: 'Food added to meal successfully', type: MealFood })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async addFoodToMeal(
    @Param('id') mealId: string,
    @Body() dto: AddFoodToMealDto,
    @Request() req
  ): Promise<MealFood> {
    return this.mealService.addFoodToMeal(mealId, dto, req.user);
  }

  @Delete('meal-foods/:id')
  @ApiOperation({ summary: 'Remove food from meal' })
  @ApiParam({ name: 'id', type: String, description: 'Meal food ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Food removed from meal successfully' })
  @ApiNotFoundResponse({ description: 'Food not found in meal' })
  async removeFoodFromMeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ): Promise<void> {
    return this.mealService.removeFoodFromMeal(id, req.user);
  }

  @Put('meal-foods/:id/toggle-eaten')
  @ApiOperation({ summary: 'Toggle food eaten status' })
  @ApiParam({ name: 'id', type: String, description: 'Meal food ID' })
  @ApiOkResponse({ description: 'Food status toggled successfully', type: Boolean })
  @ApiNotFoundResponse({ description: 'Food not found in meal' })
  async toggleFoodEaten(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ): Promise<boolean> {
    return this.mealService.toggleFoodEaten(id, req.user);
  }

  @Put('meals/:id/toggle-eaten')
  @ApiOperation({ summary: 'Toggle meal eaten status' })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiOkResponse({ description: 'Meal status toggled successfully', type: Boolean })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  async toggleMealEaten(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req
  ): Promise<boolean> {
    return this.mealService.toggleMealEaten(id, req.user);
  }

  @Get('nutrition/daily')
  @ApiOperation({ summary: 'Get daily nutrition summary' })
  @ApiQuery({ name: 'date', required: true, type: String })
  async getDailyNutrition(
    @Query('date') date: string,
    @Request() req
  ): Promise<DailyNutritionSummary> {
    try {
      // Get all meal foods for the specified date
      const targetDate = new Date(date);
      const meal = await this.mealService.getMealsByDate(targetDate, req.user);
      const mealFoods = meal.flatMap(m => m.mealFoods || []);

      return await this.nutritionCalculator.calculateDailyNutrition(
        targetDate,
        mealFoods
      );
    } catch (error) {
      this.logger.error('Failed to get daily nutrition', error);
      throw new HttpException(
        'Failed to get daily nutrition',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('nutrition/weekly')
  @ApiOperation({ summary: 'Get weekly nutrition summary' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getWeeklyNutrition(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Get daily summaries for each day in the range
      const dailySummaries: DailyNutritionSummary[] = [];
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const meals = await this.mealService.getMealsByDate(currentDate, req.user);
        const mealFoods = meals.flatMap(m => m.mealFoods || []);
        
        const dailySummary = await this.nutritionCalculator.calculateDailyNutrition(
          new Date(currentDate),
          mealFoods
        );
        dailySummaries.push(dailySummary);
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return this.nutritionCalculator.calculateWeeklyNutrition(
        start,
        end,
        dailySummaries
      );
    } catch (error) {
      this.logger.error('Failed to get weekly nutrition', error);
      throw new HttpException(
        'Failed to get weekly nutrition',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('meals/:id/nutrition')
  @ApiOperation({ summary: 'Get meal nutrition summary' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Returns meal nutrition summary' })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  async getMealNutrition(
    @Param('id') mealId: string,
    @Request() req
  ) {
    const meal = await this.mealService.getMealById(mealId, req.user);
    return this.nutritionCalculator.calculateMealNutrition(meal);
  }

  @Post('meal-plans/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate meals from one meal plan to another or create new plan' })
  @ApiParam({ name: 'id', type: String, description: 'Source meal plan ID' })
  @ApiBody({ type: DuplicateMealsDto })
  @ApiCreatedResponse({ 
    description: 'Meals duplicated successfully',
    type: MealPlan 
  })
  @ApiNotFoundResponse({ description: 'Source or target meal plan not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async duplicateMeals(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() duplicateMealsDto: DuplicateMealsDto,
    @Request() req
  ): Promise<MealPlan> {
    return this.mealPlanService.duplicateMealPlan(id, req.user);
  }
}