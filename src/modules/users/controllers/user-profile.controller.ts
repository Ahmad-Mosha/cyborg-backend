import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
  Patch,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserProfileService } from '../services/user-profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { User } from '../entities/user.entity';
import { ResponseInterceptor } from '@shared/interceptors/response.interceptor';
import { ProfilePictureDto } from '../dto/profile-picture.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';

@Controller('user-profile')
@ApiTags('User Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
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

  @Patch('profile-picture')
  @ApiOperation({
    summary: 'Upload or update profile picture',
    description:
      'Upload a new profile picture or update the existing one. Accepts JPG, JPEG, or PNG files up to 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile picture file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPG, JPEG, PNG) - Max size: 5MB',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
    type: ProfilePictureDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ProfilePictureDto> {
    return this.userProfileService.uploadProfilePicture(req.user.id, file);
  }

  @Delete('profile-picture')
  @ApiOperation({
    summary: 'Delete profile picture',
    description:
      'Removes the current profile picture and deletes it from storage. Returns success even if no profile picture exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture deleted successfully (or no picture existed)',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteProfilePicture(@Request() req): Promise<User> {
    return this.userProfileService.deleteProfilePicture(req.user.id);
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

  @Put('change-password')
  @ApiOperation({
    summary: 'Change password',
    description:
      'Change the user password by providing current password and new password',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - passwords do not match or other validation errors',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - current password is incorrect',
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.userProfileService.changePassword(
      req.user.id,
      changePasswordDto,
    );
  }
}
