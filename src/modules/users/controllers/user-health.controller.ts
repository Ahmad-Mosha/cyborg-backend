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
}
