import {
  Controller,
  Get,
  Put,
  Delete,
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
import { UserProfileService } from '../services/user-profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { User } from '../entities/user.entity';

@Controller('user-profile')
@ApiTags('User Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Retrieves the complete profile information of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req): Promise<User> {
    return this.userProfileService.findOne(req.user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates the profile information of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.userProfileService.update(req.user.id, updateProfileDto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete user profile',
    description: 'Permanently deletes the user profile and associated data',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteProfile(@Request() req): Promise<void> {
    return this.userProfileService.delete(req.user.id);
  }
}
