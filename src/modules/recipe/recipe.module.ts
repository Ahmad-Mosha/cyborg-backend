import { Module,  } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule
  ],
  controllers: [RecipeController],
  providers: [RecipeService],
})
export class RecipeModule {}