import { IsString, IsOptional, IsNumber, IsBoolean, Min, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFoodToMealDto {
  @ApiProperty({
    description: 'Search query for food',
    example: 'egg'
  })
  @ValidateIf(o => !o.foodId && !o.usdaFoodId)
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Food ID (if known)',
    example: 'uuid'
  })
  @IsString()
  @IsOptional()
  foodId?: string;

  @ApiProperty({
    description: 'USDA Food ID (if known)',
    example: 'usda-id'
  })
  @IsString()
  @IsOptional()
  usdaFoodId?: string;

  @ApiProperty({
    description: 'Serving size',
    example: 100,
    minimum: 0
  })
  @IsNumber()
  servingSize?: number;

  @ApiProperty({
    description: 'Serving unit',
    example: 'g',
    default: 'g'
  })
  @IsString()
  @IsOptional()
  servingUnit?: string = 'g';

  @ApiProperty({
    description: 'Save to favorites',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  saveToFavorites?: boolean;
}