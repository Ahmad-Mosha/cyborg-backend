import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCustomFoodDto {
  @ApiProperty({
    description: 'Name of the custom food',
    example: 'My Special Smoothie',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Calories per serving',
    example: 250,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({
    description: 'Quantity/serving size',
    example: 1,
    minimum: 0.1,
  })
  @IsNumber()
  @Min(0.1)
  quantity: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'cup',
    default: 'serving',
  })
  @IsString()
  @IsOptional()
  unit?: string = 'serving';

  @ApiProperty({
    description: 'Protein content in grams',
    example: 15,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  protein: number;

  @ApiProperty({
    description: 'Carbohydrates content in grams',
    example: 30,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  carbs: number;

  @ApiProperty({
    description: 'Fat content in grams',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  fat: number;
}
