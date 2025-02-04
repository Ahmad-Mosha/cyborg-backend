import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateUserHealthDto } from '../dto/update-user-health.dto';
import { UserDataService } from '../services/user-health.service';
import { UserData } from '../entities/user-data.entity';
import { GetUser } from '../../../shared/decorators/get-user.decorator';

@Controller('user-data')
@ApiTags('User Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserDataController {
  constructor(private readonly userDataService: UserDataService) {}

  @Get()
  @ApiOperation({ summary: 'Get user health data' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user health data',
    type: UserData,
  })
  async getUserData(@GetUser() user): Promise<UserData> {
    return this.userDataService.findOne(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update user health data' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated user health data',
    type: UserData,
  })
  async updateUserHealth(
    @GetUser() user,
    @Body() updateUserHealthDto: UpdateUserHealthDto,
  ): Promise<UserData> {
    return this.userDataService.update(user.id, updateUserHealthDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create user health data' })
  @ApiResponse({
    status: 201,
    description: 'Creates new user health data',
    type: UserData,
  })
  async createUserHealth(
    @GetUser() user,
    @Body() updateUserHealthDto: UpdateUserHealthDto,
  ): Promise<UserData> {
    return this.userDataService.update(user.id, updateUserHealthDto);
  }
}
