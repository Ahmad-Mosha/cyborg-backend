import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class CreateFoodDto {
  @IsString()
  @ApiProperty({
    description: 'The name of the food item',
    example: 'Grilled Chicken Breast',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The brand name of the food item',
    example: 'Tyson',
    required: false,
  })
  brand?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'A detailed description of the food item',
    example: 'Lean, boneless chicken breast grilled without oil',
    required: false,
  })
  description?: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'The size of one serving',
    example: 100,
    minimum: 0,
  })
  servingSize: number;

  @IsString()
  @ApiProperty({
    description: 'The unit of measurement for the serving size',
    example: 'grams',
  })
  servingUnit: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'The number of calories per serving',
    example: 165,
    minimum: 0,
  })
  calories: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'The amount of protein per serving in grams',
    example: 31,
    minimum: 0,
  })
  protein: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'The amount of carbohydrates per serving in grams',
    example: 0,
    minimum: 0,
  })
  carbs: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'The amount of fat per serving in grams',
    example: 3.6,
    minimum: 0,
  })
  fat: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: 'The amount of fiber per serving in grams',
    example: 0,
    minimum: 0,
    required: false,
  })
  fiber?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: 'The amount of sugar per serving in grams',
    example: 0,
    minimum: 0,
    required: false,
  })
  sugar?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: 'The amount of sodium per serving in milligrams',
    example: 74,
    minimum: 0,
    required: false,
  })
  sodium?: number;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'Tags to categorize the food item',
    example: ['protein', 'meat', 'low-carb'],
    required: false,
    type: [String],
  })
  tags?: string[];
}
