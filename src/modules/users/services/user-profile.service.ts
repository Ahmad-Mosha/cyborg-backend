import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UploadService } from '../../upload/upload.service';
import { ProfilePictureDto } from '../dto/profile-picture.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly uploadService: UploadService,
  ) {}

  async findOne(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'profilePictureUrl',
        'profilePictureKey',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async update(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateProfileDto);
    return this.userRepository.save(user);
  }

  async delete(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }

  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ProfilePictureDto> {
    const user = await this.findOne(userId);

    // If user already has a profile picture, delete the old one
    if (user.profilePictureKey) {
      try {
        await this.uploadService.deleteFile(user.profilePictureKey);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
        // Continue with the upload even if deletion fails
      }
    }

    // Upload the new profile picture
    const uploadResult = await this.uploadService.uploadFile(file);

    // Update user profile with the new picture information
    user.profilePictureUrl = uploadResult.url;
    user.profilePictureKey = uploadResult.key;
    await this.userRepository.save(user);

    return {
      url: uploadResult.url,
      key: uploadResult.key,
      filename: uploadResult.filename,
      size: uploadResult.size,
    };
  }

  async deleteProfilePicture(userId: string): Promise<User> {
    const user = await this.findOne(userId);

    console.log('User profile picture data:', {
      userId,
      hasUrl: !!user.profilePictureUrl,
      hasKey: !!user.profilePictureKey,
      url: user.profilePictureUrl,
      key: user.profilePictureKey,
    });

    // If no profile picture exists at all, return the user as-is
    if (!user.profilePictureUrl && !user.profilePictureKey) {
      console.log('No profile picture found for user:', userId);
      return user;
    }

    // If we have a key, try to delete from storage
    if (user.profilePictureKey) {
      console.log(
        'Attempting to delete profile picture with key:',
        user.profilePictureKey,
      );

      try {
        // Delete the profile picture from storage
        const deleteResult = await this.uploadService.deleteFile(
          user.profilePictureKey,
        );

        if (deleteResult) {
          console.log('Profile picture deleted from storage successfully');
        } else {
          console.warn(
            'Profile picture deletion from storage failed, but continuing with database cleanup',
          );
        }
      } catch (error) {
        console.error('Error details when deleting from storage:', {
          key: user.profilePictureKey,
          error: error.message,
          stack: error.stack,
        });

        // For debugging - log AWS configuration
        console.log('AWS Config:', {
          region: process.env.AWS_REGION,
          bucket: process.env.AWS_BUCKET_NAME,
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        });

        // Continue with database cleanup even if storage deletion fails
        console.log(
          'Continuing with database cleanup despite storage deletion failure',
        );
      }
    } else {
      console.log(
        'No profile picture key found, but URL exists. Cleaning up database only.',
      );
    }

    // Update user profile (clean up both URL and key)
    user.profilePictureUrl = null;
    user.profilePictureKey = null;

    const savedUser = await this.userRepository.save(user);
    console.log('User profile updated in database, picture references removed');

    return savedUser;
  }

  private async findOneWithPassword(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password'], // Include password for validation
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    // Find user with password
    const user = await this.findOneWithPassword(userId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.update(userId, { password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }
}
