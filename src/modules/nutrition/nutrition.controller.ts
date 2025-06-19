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
  Logger,
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
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MealPlanService } from './services/meal-plan.service';
import { MealService } from './services/meal.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import { AddMealDto } from './dto/add-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { AddFoodToMealDto } from './dto/add-food-to-meal.dto';
import { SearchAndAddFoodDto } from './dto/search-and-add-food.dto';
import { AddCustomFoodDto } from './dto/add-custom-food.dto';
import { MealPlan } from './entities/meal-plan.entity';
import { Meal } from './entities/meal.entity';
import { MealFood } from './entities/meal-food.entity';
import { DailyNutritionSummary } from './interfaces/daily-nutrition-summary.interface';
import { DuplicateMealsDto } from './dto/duplicate-meals.dto';
import { NutritionCalculatorService } from './services/nutrition-calculator.service';
import { FoodSearchDto } from '@modules/food/dto/food-search.dto';
import { FoodService } from '../food/food.service';

@ApiTags('Nutrition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition')
export class NutritionController {
  private readonly logger = new Logger(NutritionController.name);

  constructor(
    private readonly mealPlanService: MealPlanService,
    private readonly mealService: MealService,
    private readonly nutritionCalculator: NutritionCalculatorService,
    private readonly foodService: FoodService,
  ) {}

  @Post('meal-plans')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  )
  @ApiOperation({ summary: 'Create a new meal plan' })
  async createMealPlan(
    @Body() dto: CreateMealPlanDto,
    @Request() req,
  ): Promise<MealPlan> {
    // Filter out empty calorieDistribution objects before passing to service
    if (dto.calorieDistribution?.length) {
      dto.calorieDistribution = dto.calorieDistribution.filter(
        (meal) => meal && meal.mealName && typeof meal.percentage === 'number',
      );
    }
    return this.mealPlanService.createMealPlan(dto, req.user);
  }

  @Get('meal-plans')
  @ApiOperation({
    summary: 'Get all meal plans for current user with pagination',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getMealPlans(
    @Request() req,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
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
    @Request() req,
  ): Promise<MealPlan> {
    return this.mealPlanService.getMealPlanById(id, req.user);
  }

  @Put('meal-plans/:id')
  @ApiOperation({ summary: 'Update a meal plan' })
  @ApiParam({ name: 'id', type: String, description: 'Meal plan ID' })
  @ApiBody({ type: UpdateMealPlanDto })
  @ApiOkResponse({
    description: 'Meal plan updated successfully',
    type: MealPlan,
  })
  @ApiNotFoundResponse({ description: 'Meal plan not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateMealPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMealPlanDto: UpdateMealPlanDto,
    @Request() req,
  ): Promise<MealPlan> {
    return this.mealPlanService.updateMealPlan(id, updateMealPlanDto, req.user);
  }

  @Delete('meal-plans/:id')
  @ApiOperation({ summary: 'Delete a meal plan' })
  @ApiParam({ name: 'id', type: String, description: 'Meal plan ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Meal plan deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Meal plan not found' })
  async deleteMealPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
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
    @Request() req,
  ): Promise<Meal> {
    return this.mealService.addMealToMealPlan(id, addMealDto, req.user);
  }

  @Post('meal-plans/:id/smart-meal')
  @ApiOperation({
    summary: 'Add a meal to a plan with automatic percentage adjustment',
  })
  @ApiParam({ name: 'id', type: String, description: 'Meal plan ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mealName: {
          type: 'string',
          description: 'Name of the meal',
          example: 'Afternoon Snack',
        },
        targetTime: {
          type: 'string',
          description: 'Target time for meal (HH:MM)',
          example: '15:30',
        },
        targetCalories: {
          type: 'number',
          description: 'Target calories for meal (optional)',
          example: 250,
        },
        percentage: {
          type: 'number',
          description: 'Percentage of daily calories for this meal (optional)',
          example: 15,
        },
      },
      required: ['mealName'],
    },
  })
  @ApiCreatedResponse({
    description: 'Meal added successfully with auto-adjusted distribution',
    type: Meal,
  })
  @ApiNotFoundResponse({ description: 'Meal plan not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async addSmartMealToMealPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    addMealDto: {
      mealName: string;
      targetTime?: string;
      targetCalories?: number;
      percentage?: number;
    },
    @Request() req,
  ): Promise<Meal> {
    return this.mealPlanService.addMealToPlan(
      id,
      addMealDto.mealName,
      addMealDto.targetTime,
      addMealDto.targetCalories,
      addMealDto.percentage,
      req.user,
    );
  }

  @Get('meals/average-calories')
  @ApiOperation({
    summary: 'Get average calories of all meals',
    description:
      'Returns the average calories per meal and total number of meals for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Average calories calculated successfully',
    schema: {
      type: 'object',
      properties: {
        averageCalories: {
          type: 'number',
          description: 'Average calories per meal (rounded)',
          example: 450,
        },
        totalMeals: {
          type: 'number',
          description: 'Total number of meals with calories > 0',
          example: 25,
        },
      },
    },
  })
  async getAverageCalories(
    @Request() req,
  ): Promise<{ averageCalories: number; totalMeals: number }> {
    try {
      console.log('Getting average calories for user:', req.user?.id);
      const result = await this.mealService.getAverageCalories(req.user);
      console.log('Average calories result:', result);
      return result;
    } catch (error) {
      console.error('Error in getAverageCalories controller:', error);
      throw error;
    }
  }

  @Get('meals/:id')
  @ApiOperation({ summary: 'Get meal by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Returns the meal', type: Meal })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  async getMealById(@Param('id') id: string, @Request() req): Promise<Meal> {
    return this.mealService.getMealById(id, req.user);
  }

  @Put('meals/:id')
  @ApiOperation({ summary: 'Update a meal' })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiBody({ type: UpdateMealDto })
  @ApiOkResponse({ description: 'Meal updated successfully', type: Meal })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateMeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMealDto: UpdateMealDto,
    @Request() req,
  ): Promise<Meal> {
    return this.mealService.updateMeal(id, updateMealDto, req.user);
  }

  @Delete('meals/:id')
  @ApiOperation({ summary: 'Delete a meal' })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Meal deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  async deleteMeal(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<void> {
    return this.mealService.deleteMeal(id, req.user);
  }

  @Post('meals/:id/foods')
  @ApiOperation({ summary: 'Add food to meal' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AddFoodToMealDto })
  @ApiCreatedResponse({
    description: 'Food added to meal successfully',
    type: MealFood,
  })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async addFoodToMeal(
    @Param('id') mealId: string,
    @Body() dto: AddFoodToMealDto,
    @Request() req,
  ): Promise<MealFood> {
    return this.mealService.addFoodToMeal(mealId, dto, req.user);
  }

  @Post('meals/:id/foods/search')
  @ApiOperation({
    summary: 'Add food from search results to meal',
    description:
      'Add a specific food item from search results (external API or database) to a meal',
  })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiBody({ type: SearchAndAddFoodDto })
  @ApiCreatedResponse({
    description: 'Food added to meal successfully from search results',
    type: MealFood,
  })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  @ApiBadRequestResponse({
    description: 'Invalid input data or food not found',
  })
  async addFoodFromSearchToMeal(
    @Param('id', ParseUUIDPipe) mealId: string,
    @Body() dto: SearchAndAddFoodDto,
    @Request() req,
  ): Promise<MealFood> {
    return this.mealService.addFoodFromSearch(
      mealId,
      {
        foodId: dto.foodId,
        quantity: dto.quantity,
        unit: dto.unit,
        foodName: dto.foodName,
        isExternalApi: dto.isExternalApi,
      },
      req.user,
    );
  }

  @Post('meals/:id/foods/custom')
  @ApiOperation({
    summary: 'Add custom food to meal',
    description:
      'Create and add a custom food with specified nutrition values to a meal',
  })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiBody({ type: AddCustomFoodDto })
  @ApiCreatedResponse({
    description: 'Custom food created and added to meal successfully',
    type: MealFood,
  })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async addCustomFoodToMeal(
    @Param('id', ParseUUIDPipe) mealId: string,
    @Body() dto: AddCustomFoodDto,
    @Request() req,
  ): Promise<MealFood> {
    return this.mealService.addCustomFoodToMeal(
      mealId,
      {
        name: dto.name,
        calories: dto.calories,
        quantity: dto.quantity,
        unit: dto.unit,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
      },
      req.user,
    );
  }

  @Put('meals/:id/toggle-eaten')
  @ApiOperation({ summary: 'Toggle meal eaten status' })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiOkResponse({
    description: 'Meal status toggled successfully',
    type: Boolean,
  })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  async toggleMealEaten(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<boolean> {
    return this.mealService.toggleMealEaten(id, req.user);
  }

  @Get('nutrition/daily')
  @ApiOperation({ summary: 'Get daily nutrition summary' })
  @ApiQuery({ name: 'date', required: true, type: String })
  async getDailyNutrition(
    @Query('date') date: string,
    @Request() req,
  ): Promise<DailyNutritionSummary> {
    try {
      const targetDate = new Date(date);
      console.log('Getting nutrition for date:', targetDate);

      const meals = await this.mealService.getMealsByDate(targetDate, req.user);
      console.log(`Found ${meals.length} meals`);

      if (!meals || meals.length === 0) {
        console.log('No meals found for this date');
        return {
          date: targetDate,
          summary: {
            calories: {
              target: 0,
              eaten: 0,
              remaining: 0,
            },
            mainNutrients: {
              protein: { amount: 0, unit: 'g', percentage: 0 },
              carbs: { amount: 0, unit: 'g', percentage: 0 },
              fat: { amount: 0, unit: 'g', percentage: 0 },
            },
            additionalNutrients: {
              fiber: { amount: 0, unit: 'g' },
              sugar: { amount: 0, unit: 'g' },
              sodium: { amount: 0, unit: 'mg' },
              cholesterol: { amount: 0, unit: 'mg' },
            },
          },
          meals: [],
          progress: {
            mealsEaten: 0,
            totalMeals: meals.length,
            percentage: 0,
          },
          mealDistribution: [],
        };
      }

      const mealFoods = meals.flatMap((meal) => meal.mealFoods || []);
      console.log(`Total meal foods: ${mealFoods.length}`);

      // Recalculate nutrition for all meals to ensure we have the latest data
      for (const meal of meals) {
        await this.mealService.recalculateMealNutrition(meal);
      }

      const summary = await this.nutritionCalculator.calculateDailyNutrition(
        targetDate,
        meals,
      );

      if (meals[0]?.mealPlan) {
        summary.summary.calories.target = meals[0].mealPlan.targetCalories || 0;
      }

      return summary;
    } catch (error) {
      console.error('Error in getDailyNutrition:', error);
      throw new HttpException(
        'Failed to get daily nutrition: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
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
    @Request() req,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get daily summaries for each day in the range
      const dailySummaries: DailyNutritionSummary[] = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const meals = await this.mealService.getMealsByDate(
          currentDate,
          req.user,
        );

        // Recalculate nutrition for all meals to ensure we have the latest data
        for (const meal of meals) {
          await this.mealService.recalculateMealNutrition(meal);
        }

        const dailySummary =
          await this.nutritionCalculator.calculateDailyNutrition(
            new Date(currentDate),
            meals,
          );
        dailySummaries.push(dailySummary);

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return this.nutritionCalculator.calculateWeeklyNutrition(
        start,
        end,
        dailySummaries,
      );
    } catch (error) {
      this.logger.error('Failed to get weekly nutrition', error);
      throw new HttpException(
        'Failed to get weekly nutrition',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('meals/:id/nutrition')
  @ApiOperation({ summary: 'Get meal nutrition summary' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Returns meal nutrition summary' })
  @ApiNotFoundResponse({ description: 'Meal not found' })
  async getMealNutrition(@Param('id') mealId: string, @Request() req) {
    const meal = await this.mealService.getMealById(mealId, req.user);

    // Ensure we have the latest nutrition data
    await this.mealService.recalculateMealNutrition(meal);

    return this.nutritionCalculator.calculateMealNutrition(meal);
  }

  @Post('meal-plans/:id/duplicate')
  @ApiOperation({
    summary: 'Duplicate meals from one meal plan to another or create new plan',
  })
  @ApiParam({ name: 'id', type: String, description: 'Source meal plan ID' })
  @ApiBody({ type: DuplicateMealsDto })
  @ApiCreatedResponse({
    description: 'Meals duplicated successfully',
    type: MealPlan,
  })
  @ApiNotFoundResponse({ description: 'Source or target meal plan not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async duplicateMeals(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() duplicateMealsDto: DuplicateMealsDto,
    @Request() req,
  ): Promise<MealPlan> {
    return this.mealPlanService.duplicateMealPlan(id, req.user);
  }

  @Post('meal-plans/:id/daily-meals')
  @ApiOperation({
    summary: 'Create daily meals from template for a specific date',
  })
  @ApiParam({ name: 'id', type: String, description: 'Meal plan ID' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiCreatedResponse({
    description: 'Daily meals created successfully',
    type: [Meal],
  })
  @ApiNotFoundResponse({ description: 'Meal plan not found' })
  async createDailyMealsFromTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') dateString: string,
    @Request() req,
  ): Promise<Meal[]> {
    const date = new Date(dateString);
    return this.mealService.createDailyMealsFromTemplate(id, date, req.user);
  }

  @Get('foods/search')
  @ApiOperation({
    summary: 'Search for foods',
    description:
      'Search for foods from external API that can be added to meals',
  })
  @ApiQuery({
    name: 'query',
    type: String,
    description: 'Search query (e.g., "egg")',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Food search results',
    schema: {
      type: 'object',
      properties: {
        foods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fdcId: {
                type: 'string',
                description: 'Food ID from external API',
              },
              description: {
                type: 'string',
                description: 'Food name/description',
              },
              calories: { type: 'number', description: 'Calories per 100g' },
              protein: { type: 'number', description: 'Protein per 100g' },
              carbohydrates: { type: 'number', description: 'Carbs per 100g' },
              fat: { type: 'number', description: 'Fat per 100g' },
            },
          },
        },
        totalHits: { type: 'number', description: 'Total search results' },
        currentPage: { type: 'number', description: 'Current page' },
        totalPages: { type: 'number', description: 'Total pages' },
      },
    },
  })
  async searchFoods(
    @Query('query') query: string,
    @Request() req,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    if (!query || query.trim().length === 0) {
      throw new HttpException(
        'Search query is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Use the food service to search foods
      const result = await this.foodService.searchFoods(
        query.trim(),
        page || 1,
        pageSize || 10,
      );

      return result;
    } catch (error) {
      this.logger.error('Error searching foods:', error);
      throw new HttpException(
        'Failed to search foods',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test/mobile-workflow')
  @ApiOperation({
    summary: 'MOBILE APP WORKFLOW - Simple food search and add',
    description: 'Shows the simple 2-step process for mobile apps',
  })
  async getMobileWorkflowInstructions() {
    return {
      message: 'SIMPLE MOBILE WORKFLOW - Search and Add Food',
      steps: [
        {
          step: 1,
          title: '🔍 SEARCH FOODS',
          method: 'GET',
          endpoint: '/nutrition/foods/search?query=egg',
          description:
            "User types 'egg' in search box, app calls this endpoint",
          response_example: {
            foods: [
              {
                usdaId: '123456',
                name: 'Egg, whole, raw',
                calories: 155,
                protein: 13,
                carbohydrates: 1.1,
                fat: 11,
              },
            ],
          },
        },
        {
          step: 2,
          title: '⚡ ADD TO MEAL (SUPER FAST - <1 second)',
          method: 'POST',
          endpoint: '/nutrition/meals/{mealId}/add-food-fast',
          description: "User clicks 'Add' button - lightning fast response!",
          body_example: {
            foodId: '123456',
            quantity: 100,
            foodData: {
              name: 'Egg, whole, raw',
              calories: 155,
              protein: 13,
              carbohydrates: 1.1,
              fat: 11,
              fiber: 0,
              sugar: 0.4,
              sodium: 124,
            },
          },
          mobile_implementation:
            '✨ Pass the food data from step 1 - no API calls needed = INSTANT ADD!',
        },
      ],
      alternative_custom_food: {
        title: '🍽️ ADD CUSTOM FOOD',
        endpoint: '/nutrition/meals/{mealId}/add-custom-food-simple',
        body: {
          name: 'My Custom Food',
          calories: 200,
          quantity: 100,
          protein: 10, // optional
          carbs: 20, // optional
          fat: 5, // optional
        },
      },
      mobile_tips: [
        'Step 1: User searches for food',
        "Step 2: User sees list of foods with 'Add' buttons",
        "Step 3: User clicks 'Add' → app sends simple request",
        'Done! Food is added to meal automatically',
      ],
      food_deletion: {
        title: '🗑️ REMOVE FOOD FROM MEAL',
        simple_method: {
          endpoint: 'DELETE /nutrition/meal-foods/{mealFoodId}',
          description: 'Use the MealFood ID from meal.mealFoods[].id',
          mobile_tip:
            'Each food in a meal has a unique mealFoodId - use this for deletion',
        },
        traditional_method: {
          endpoint: 'DELETE /nutrition/meals/{mealId}/foods/{foodId}',
          description: 'Use meal ID and food entity ID',
          mobile_tip: 'More complex - need both meal ID and food ID',
        },
        recommended: 'Use the simple method with mealFoodId for mobile apps',
      },
    };
  }

  @Post('meals/:id/add-food-simple')
  @ApiOperation({
    summary: 'Simple add food to meal (Mobile-friendly)',
    description:
      'Add food to meal with just foodId and quantity - system handles everything else',
  })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        foodId: {
          type: 'string',
          description: 'Food ID from search results (usdaId)',
          example: '123456',
        },
        quantity: {
          type: 'number',
          description: 'Amount in grams',
          example: 100,
          minimum: 1,
        },
      },
      required: ['foodId', 'quantity'],
    },
  })
  @ApiCreatedResponse({
    description: 'Food added to meal successfully',
    type: MealFood,
  })
  async addFoodToMealSimple(
    @Param('id', ParseUUIDPipe) mealId: string,
    @Body() body: { foodId: string; quantity: number },
    @Request() req,
  ): Promise<MealFood> {
    // Simple mobile-friendly endpoint - just needs foodId and quantity
    return this.mealService.addFoodFromSearch(
      mealId,
      {
        foodId: body.foodId,
        quantity: body.quantity,
        unit: 'g', // Default to grams
        isExternalApi: true, // Always assume external API
      },
      req.user,
    );
  }

  @Post('meals/:id/add-custom-food-simple')
  @ApiOperation({
    summary: 'Simple add custom food to meal (Mobile-friendly)',
    description: 'Add custom food with just name, calories, and basic macros',
  })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'My Food' },
        calories: { type: 'number', example: 200 },
        quantity: { type: 'number', example: 100 },
        protein: { type: 'number', example: 10, default: 0 },
        carbs: { type: 'number', example: 20, default: 0 },
        fat: { type: 'number', example: 5, default: 0 },
      },
      required: ['name', 'calories', 'quantity'],
    },
  })
  async addCustomFoodToMealSimple(
    @Param('id', ParseUUIDPipe) mealId: string,
    @Body()
    body: {
      name: string;
      calories: number;
      quantity: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    },
    @Request() req,
  ): Promise<MealFood> {
    return this.mealService.addCustomFoodToMeal(
      mealId,
      {
        name: body.name,
        calories: body.calories,
        quantity: body.quantity,
        unit: 'g',
        protein: body.protein || 0,
        carbs: body.carbs || 0,
        fat: body.fat || 0,
      },
      req.user,
    );
  }

  @Post('meals/:id/add-food-fast')
  @ApiOperation({
    summary: '⚡ FASTEST - Add food to meal (optimized for mobile)',
    description:
      'Add food with nutrition data from search results - no additional API calls needed',
  })
  @ApiParam({ name: 'id', type: String, description: 'Meal ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        foodId: {
          type: 'string',
          description: 'Food ID from search results (usdaId)',
          example: '123456',
        },
        quantity: {
          type: 'number',
          description: 'Amount in grams',
          example: 100,
          minimum: 1,
        },
        foodData: {
          type: 'object',
          description: 'Nutrition data from search results (avoids API calls)',
          properties: {
            name: { type: 'string', example: 'Egg, whole, raw' },
            calories: { type: 'number', example: 155 },
            protein: { type: 'number', example: 13 },
            carbohydrates: { type: 'number', example: 1.1 },
            fat: { type: 'number', example: 11 },
            fiber: { type: 'number', example: 0 },
            sugar: { type: 'number', example: 0.4 },
            sodium: { type: 'number', example: 124 },
          },
          required: ['name', 'calories', 'protein', 'carbohydrates', 'fat'],
        },
      },
      required: ['foodId', 'quantity', 'foodData'],
    },
  })
  @ApiCreatedResponse({
    description: '⚡ Food added to meal in <1 second!',
    type: MealFood,
  })
  async addFoodToMealFast(
    @Param('id', ParseUUIDPipe) mealId: string,
    @Body()
    body: {
      foodId: string;
      quantity: number;
      foodData: {
        name: string;
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber?: number;
        sugar?: number;
        sodium?: number;
      };
    },
    @Request() req,
  ): Promise<MealFood> {
    // Super fast - uses data from search results, no API calls
    return this.mealService.addFoodFromSearchOptimized(
      mealId,
      {
        foodId: body.foodId,
        quantity: body.quantity,
        unit: 'g',
        foodData: body.foodData,
      },
      req.user,
    );
  }

  @Delete('meals/:mealId/foods/:foodId')
  @ApiOperation({
    summary: '🗑️ Remove food from meal',
    description:
      'Remove any food item from a meal (works with API foods, custom foods, etc.)',
  })
  @ApiParam({ name: 'mealId', type: String, description: 'Meal ID' })
  @ApiParam({
    name: 'foodId',
    type: String,
    description: 'Food ID (from the food entity)',
  })
  @ApiResponse({
    status: 200,
    description: 'Food removed from meal successfully',
  })
  @ApiNotFoundResponse({ description: 'Meal or food not found' })
  async removeFoodFromMeal(
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @Param('foodId', ParseUUIDPipe) foodId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.mealService.removeFoodFromMeal(mealId, foodId, req.user);
    return { message: 'Food removed from meal successfully' };
  }

  @Delete('meal-foods/:mealFoodId')
  @ApiOperation({
    summary: '🗑️ Remove food from meal (Simple)',
    description:
      'Remove food using MealFood relationship ID - simplest method for mobile apps',
  })
  @ApiParam({
    name: 'mealFoodId',
    type: String,
    description: 'MealFood relationship ID (from meal.mealFoods[].id)',
  })
  @ApiResponse({
    status: 200,
    description: 'Food removed from meal successfully',
  })
  @ApiNotFoundResponse({ description: 'Food item not found' })
  async removeFoodFromMealSimple(
    @Param('mealFoodId', ParseUUIDPipe) mealFoodId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.mealService.removeFoodFromMealByMealFoodId(mealFoodId, req.user);
    return { message: 'Food removed from meal successfully' };
  }
}
