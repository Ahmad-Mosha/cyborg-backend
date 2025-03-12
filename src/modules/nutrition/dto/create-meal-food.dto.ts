import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMealFoodDto {
  @ApiProperty({
    description: 'Serving size',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  servingSize: number;

  @ApiProperty({
    description: 'Serving unit',
    default: 'g'
  })
  @IsString()
  servingUnit: string;

  @ApiProperty({
    description: 'Food ID from database'
  })
  @IsString()
  foodId: string;
} 