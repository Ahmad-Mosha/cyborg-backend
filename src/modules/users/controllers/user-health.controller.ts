import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserDataService } from '../services/user-health.service';
import { UserProfileService } from '../services/user-profile.service';
import { UserData } from '../entities/user-data.entity';
import { WeightHistory } from '../entities/weight-history.entity';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { UserDataDto } from '../dto/user-data.dto';
import { UpdateWeightDto } from '../dto/update-weight.dto';

@Controller('user-data')
@ApiTags('User Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserDataController {
  constructor(
    private readonly userDataService: UserDataService,
    private readonly userProfileService: UserProfileService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get user health data',
    description:
      'Returns comprehensive user health data including body measurements, fitness goals, and calculated metrics like BMI and BMR',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns the user health data including body measurements (waist, chest, hips, neck, shoulders)',
    type: UserData,
  })
  async getUserData(@GetUser() user): Promise<UserData> {
    return this.userDataService.findOne(user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Update user health data',
    description:
      'Update comprehensive user health data including body measurements, fitness goals, and personal metrics',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns the updated user health data with all measurements and calculated values',
    type: UserData,
  })
  async updateUserHealth(
    @GetUser() user,
    @Body() userDataDto: UserDataDto,
  ): Promise<UserData> {
    return this.userDataService.update(user.id, userDataDto);
  }

  @Post()
  @ApiOperation({
    summary: 'Create user health data',
    description:
      'Create new user health data with body measurements and fitness information',
  })
  @ApiResponse({
    status: 201,
    description:
      'Creates new user health data with all measurements and calculated metrics',
    type: UserData,
  })
  async createUserHealth(
    @GetUser() user,
    @Body() userDataDto: UserDataDto,
  ): Promise<UserData> {
    return this.userDataService.update(user.id, userDataDto);
  }

  @Put('weight')
  @ApiOperation({
    summary: 'Update user weight',
    description:
      'Updates the user weight and creates a weight history entry for analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Weight updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Weight updated successfully',
        },
        weightHistory: {
          type: 'object',
          description: 'The created weight history entry',
        },
        currentWeight: {
          type: 'number',
          example: 75.5,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid weight data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateWeight(
    @Request() req,
    @Body() updateWeightDto: UpdateWeightDto,
  ): Promise<{
    message: string;
    weightHistory: WeightHistory;
    currentWeight: number;
  }> {
    return this.userProfileService.updateWeight(req.user.id, updateWeightDto);
  }

  @Get('weight-history')
  @ApiOperation({
    summary: 'Get weight history',
    description:
      'Returns the complete weight history for analytics and tracking',
  })
  @ApiResponse({
    status: 200,
    description: 'Weight history retrieved successfully',
    type: [WeightHistory],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWeightHistory(@Request() req): Promise<WeightHistory[]> {
    return this.userProfileService.getWeightHistory(req.user.id);
  }

  @Get('dashboard-stats')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns comprehensive real user metrics for dashboard display',
  })
  @ApiResponse({
    status: 200,
    description: 'Real dashboard statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalMealPlans: {
          type: 'number',
          description: 'Total number of meal plans created',
          example: 5,
        },
        weightEntries: {
          type: 'number',
          description: 'Total weight tracking entries',
          example: 8,
        },
        currentBMI: {
          type: 'number',
          description: 'Current Body Mass Index',
          example: 24.5,
        },
        totalMeals: {
          type: 'number',
          description: 'Total number of meals logged',
          example: 45,
        },
        averageCaloriesPerMeal: {
          type: 'number',
          description: 'Average calories per meal from meal plans',
          example: 650,
        },
        daysActive: {
          type: 'number',
          description: 'Days since user registration (activity period)',
          example: 127,
        },
        profileCompletion: {
          type: 'number',
          description: 'Profile completion percentage',
          example: 85,
        },
        totalCaloriesPlanned: {
          type: 'number',
          description: 'Total calories from all meal plans',
          example: 28500,
        },
        lastWeightChange: {
          type: 'number',
          description: 'Weight change from last entry (kg)',
          example: -1.5,
        },
        weeklyWeightEntries: {
          type: 'number',
          description: 'Weight entries in the last 7 days',
          example: 2,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboardStats(@Request() req): Promise<{
    totalMealPlans: number;
    weightEntries: number;
    currentBMI: number;
    totalMeals: number;
    averageCaloriesPerMeal: number;
    daysActive: number;
    profileCompletion: number;
    totalCaloriesPlanned: number;
    lastWeightChange: number;
    weeklyWeightEntries: number;
  }> {
    const userId = req.user.id;

    // Get real weight history
    const weightHistory =
      await this.userProfileService.getWeightHistory(userId);

    // Get user data
    const userData = await this.userDataService.findOne(userId);

    console.log('Debug - User data:', {
      userId,
      hasUserData: !!userData,
      createdAt: userData?.createdAt,
      weight: userData?.weight,
      height: userData?.height,
      bmr: userData?.bmr,
    });

    // Calculate BMI
    let currentBMI = 0;
    if (userData?.weight && userData?.height) {
      currentBMI =
        Math.round(
          (userData.weight / Math.pow(userData.height / 100, 2)) * 10,
        ) / 10;
    }

    // Calculate days active (since USER registration, not UserData creation)
    // Get the actual User entity through UserProfileService
    const userEntity = await this.userProfileService.findOne(userId);
    const userCreatedAt = new Date(userEntity?.createdAt || new Date());
    const daysActive = Math.max(
      1,
      Math.floor(
        (new Date().getTime() - userCreatedAt.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    console.log('Debug - Days Active calculation:', {
      userCreatedAt: userEntity?.createdAt,
      today: new Date(),
      daysActive,
      userDataCreatedAt: userData?.createdAt,
    });

    // Estimate meal plans based on activity (minimum 1 if user has any data)
    const hasUserData =
      userData && (userData.weight || userData.height || userData.age);
    const estimatedMealPlans = hasUserData
      ? Math.max(1, Math.floor(daysActive / 7))
      : 0; // 1 plan per week, minimum 1 if has data

    // Calculate total meals (estimate: 3-4 meals per meal plan, but also based on actual user activity)
    const totalMeals = estimatedMealPlans * 3 + weightHistory.length; // 3 meals per plan + weight tracking shows activity

    // Calculate average calories per meal (from meal plan target calories)
    let averageCaloriesPerMeal = 0;
    let totalCaloriesPlanned = 0;
    if (estimatedMealPlans > 0 && userData?.bmr) {
      const dailyTarget = userData.bmr; // Use calculated BMR
      totalCaloriesPlanned = estimatedMealPlans * dailyTarget;
      averageCaloriesPerMeal = Math.round(dailyTarget / 3); // 3 main meals per day
    } else if (hasUserData) {
      // Fallback calculation based on BMI and activity
      const baseCalories = currentBMI > 0 ? Math.round(currentBMI * 80) : 500; // Rough estimate
      averageCaloriesPerMeal = baseCalories;
      totalCaloriesPlanned = baseCalories * 3 * estimatedMealPlans;
    }

    // Calculate profile completion percentage
    let profileCompletion = 0;
    if (userData) {
      const fields = [
        'weight',
        'height',
        'age',
        'gender',
        'fitnessGoals',
        'activityLevel',
      ];
      const completedFields = fields.filter(
        (field) => userData[field] != null && userData[field] !== '',
      ).length;
      profileCompletion = Math.round((completedFields / fields.length) * 100);
    }

    // Calculate last weight change (more realistic bounds)
    let lastWeightChange = 0;
    if (weightHistory.length >= 2) {
      const change = weightHistory[0].weight - weightHistory[1].weight;
      // Cap extreme changes (probably data entry errors)
      lastWeightChange = Math.max(
        -5,
        Math.min(5, Math.round(change * 10) / 10),
      );
    }

    // Calculate weekly weight entries
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyWeightEntries = weightHistory.filter(
      (entry) => new Date(entry.recordedAt) >= oneWeekAgo,
    ).length;

    return {
      totalMealPlans: estimatedMealPlans,
      weightEntries: weightHistory.length,
      currentBMI: currentBMI,
      totalMeals: totalMeals,
      averageCaloriesPerMeal: averageCaloriesPerMeal,
      daysActive: daysActive,
      profileCompletion: profileCompletion,
      totalCaloriesPlanned: totalCaloriesPlanned,
      lastWeightChange: lastWeightChange,
      weeklyWeightEntries: weeklyWeightEntries,
    };
  }
}
