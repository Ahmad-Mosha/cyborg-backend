import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserHealthService } from '../services/user-health.service';
import { UpdateUserHealthDto } from '../dto/update-user-health.dto';
import { UserHealth } from '../entities/user-health.entity';

@Controller('user-health')
@ApiTags('User Health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserHealthController {
  constructor(private readonly userHealthService: UserHealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get user health data' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user health data',
    type: UserHealth,
  })
  async getUserHealth(@Request() req): Promise<UserHealth> {
    return this.userHealthService.findOne(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update user health data' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated user health data',
    type: UserHealth,
  })
  async updateUserHealth(
    @Request() req,
    @Body() updateUserHealthDto: UpdateUserHealthDto,
  ): Promise<UserHealth> {
    // Calculate BMI if weight and height are provided
    if (updateUserHealthDto.weight && updateUserHealthDto.height) {
      const bmi = await this.userHealthService.calculateBMI(
        updateUserHealthDto.height,
        updateUserHealthDto.weight,
      );
      updateUserHealthDto.bmi = bmi;
    }

    // Calculate BMR if all required parameters are provided
    if (
      updateUserHealthDto.weight &&
      updateUserHealthDto.height &&
      updateUserHealthDto.age &&
      updateUserHealthDto.gender
    ) {
      const bmr = await this.userHealthService.calculateBMR(
        updateUserHealthDto.weight,
        updateUserHealthDto.height,
        updateUserHealthDto.age,
        updateUserHealthDto.gender,
      );
      updateUserHealthDto.bmr = bmr;
    }

    return this.userHealthService.update(req.user.id, updateUserHealthDto);
  }
}
