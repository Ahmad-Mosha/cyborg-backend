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

@Module({
  imports: [TypeOrmModule.forFeature([User, UserData])],
  controllers: [UsersController, UserDataController, UserProfileController],
  providers: [UsersService, UserDataService, UserProfileService],
  exports: [UsersService],
})
export class UsersModule {}
