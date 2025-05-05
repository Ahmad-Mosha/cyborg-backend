import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomFoodDto {
  @ApiProperty({
    description: 'Name of the food',
    example: 'Homemade Granola',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the food',
    example: 'My homemade granola with honey and nuts',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Calories per serving',
    example: 250,
    required: true,
  })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({
    description: 'Protein content in grams',
    example: 7,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  protein?: number;

  @ApiProperty({
    description: 'Carbohydrates content in grams',
    example: 35,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  carbohydrates?: number;

  @ApiProperty({
    description: 'Fat content in grams',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fat?: number;

  @ApiProperty({
    description: 'Serving size',
    example: 45,
    default: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  servingSize?: number;

  @ApiProperty({
    description: 'Serving unit',
    example: 'g',
    default: 'g',
    required: false,
  })
  @IsString()
  @IsOptional()
  servingUnit?: string;
}
