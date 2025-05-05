import { IsString, IsOptional, IsNumber, IsBoolean, Min, ValidateIf, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CustomFoodInfo {
  @ApiProperty({
    description: 'Name of the custom food',
    example: 'Homemade Granola'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Calories per serving',
    example: 250
  })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({
    description: 'Protein content in grams',
    example: 7,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  protein?: number;

  @ApiProperty({
    description: 'Carbohydrates content in grams',
    example: 35,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  carbohydrates?: number;

  @ApiProperty({
    description: 'Fat content in grams',
    example: 10,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fat?: number;
}

export class AddFoodToMealDto {
  @ApiProperty({
    description: 'Search query for food',
    example: 'egg',
    required: false
  })
  @ValidateIf(o => !o.foodId && !o.usdaFoodId && !o.customFood)
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    description: 'Food ID from database',
    example: 'uuid',
    required: false
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  @ValidateIf(o => !o.query && !o.usdaFoodId && !o.customFood)
  foodId?: string;

  @ApiProperty({
    description: 'USDA Food ID (if known)',
    example: 'usda-id',
    required: false
  })
  @IsString()
  @IsOptional()
  @ValidateIf(o => !o.query && !o.foodId && !o.customFood)
  usdaFoodId?: string;
  
  @ApiProperty({
    description: 'Custom food information (for quick one-time food entry)',
    required: false,
    type: CustomFoodInfo
  })
  @IsObject()
  @ValidateIf(o => !o.query && !o.foodId && !o.usdaFoodId)
  @IsOptional()
  @Type(() => CustomFoodInfo)
  customFood?: CustomFoodInfo;

  @ApiProperty({
    description: 'Serving size',
    example: 100,
    minimum: 0,
    default: 100
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  servingSize?: number = 100;

  @ApiProperty({
    description: 'Serving unit',
    example: 'g',
    default: 'g'
  })
  @IsString()
  @IsOptional()
  servingUnit?: string = 'g';

  @ApiProperty({
    description: 'Save custom food to user\'s food collection',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  saveToCollection?: boolean;
}