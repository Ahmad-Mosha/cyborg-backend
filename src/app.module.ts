import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FoodModule } from './modules/food/food.module';
import { CommunityModule } from './modules/community/community.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ChatModule } from './modules/chat/chat.module';
import { databaseConfig } from './config/database.config';
import { RecipeModule } from './modules/recipe/recipe.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { NutritionModule } from '@modules/nutrition/nutrition.module';
import { UploadModule } from '@modules/upload/upload.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    FoodModule,
    CommunityModule,
    ExercisesModule,
    ChatModule,
    NutritionModule,
    RecipeModule,
    WorkoutModule,
    UploadModule,
  ],
  providers: [],
})
export class AppModule {}
