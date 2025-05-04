import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UploadService } from '../../upload/upload.service';
import { ProfilePictureDto } from '../dto/profile-picture.dto';

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
    
    if (!user.profilePictureKey) {
      throw new NotFoundException('Profile picture not found');
    }

    // Delete the profile picture from storage
    await this.uploadService.deleteFile(user.profilePictureKey);
    
    // Update user profile
    user.profilePictureUrl = null;
    user.profilePictureKey = null;
    
    return this.userRepository.save(user);
  }
}