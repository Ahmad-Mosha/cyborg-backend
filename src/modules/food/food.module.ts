import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './entities/food.entity';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';

@Module({

    imports: [TypeOrmModule.forFeature([Food])],
    controllers: [FoodController],
    providers: [FoodService],
})
export class FoodModule {}
