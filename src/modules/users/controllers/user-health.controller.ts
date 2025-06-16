import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserDataService } from '../services/user-health.service';
import { UserData } from '../entities/user-data.entity';
import { GetUser } from '../../../shared/decorators/get-user.decorator';
import { UserDataDto } from '../dto/user-data.dto';

@Controller('user-data')
@ApiTags('User Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserDataController {
  constructor(private readonly userDataService: UserDataService) {}

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
}
