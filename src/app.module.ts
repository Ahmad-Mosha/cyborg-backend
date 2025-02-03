import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { CommunityModule } from './modules/community/community.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

import { FoodModule } from './modules/food/food.module';

import { ExercisesModule } from './modules/exercises/exercises.module';

import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    WorkoutsModule,
    CommunityModule,
    NutritionModule,
    NotificationsModule,
    FoodModule,
    ExercisesModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
