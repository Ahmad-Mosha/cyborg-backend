import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserDataService } from './services/user-health.service';
import { UserProfileService } from './services/user-profile.service';
import { UserDataController } from './controllers/user-health.controller';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserData } from './entities/user-data.entity';
import { WeightHistory } from './entities/weight-history.entity';
import { UploadModule } from '@modules/upload/upload.module';
import { UploadService } from '@modules/upload/upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserData, WeightHistory]), UploadModule],
  controllers: [UsersController, UserDataController, UserProfileController],
  providers: [UsersService, UserDataService, UserProfileService, UploadService],
  exports: [UsersService , UserDataService, UserProfileService, ],
})
export class UsersModule {}
