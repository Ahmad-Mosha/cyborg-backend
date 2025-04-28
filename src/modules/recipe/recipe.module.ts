import { Module,  } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from '@modules/upload/upload.service';


@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, 
      },
    }),
  ],
  controllers: [RecipeController],
  providers: [RecipeService , UploadService],
})
export class RecipeModule {}