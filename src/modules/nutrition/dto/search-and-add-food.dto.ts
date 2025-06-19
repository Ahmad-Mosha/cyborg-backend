import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchAndAddFoodDto {
  @ApiProperty({
    description: 'Food ID from external API or database',
    example: '123456',
  })
  @IsString()
  foodId: string;

  @ApiProperty({
    description: 'Serving size/quantity',
    example: 100,
    minimum: 0.1,
  })
  @IsNumber()
  @Min(0.1)
  quantity: number;

  @ApiProperty({
    description: 'Serving unit (g, oz, cup, etc.)',
    example: 'g',
    default: 'g',
  })
  @IsString()
  @IsOptional()
  unit?: string = 'g';

  @ApiProperty({
    description: 'Food name (for display purposes)',
    example: 'Boiled Egg',
    required: false,
  })
  @IsString()
  @IsOptional()
  foodName?: string;

  @ApiProperty({
    description:
      'Whether this is from external API (USDA) or internal database',
    example: true,
    default: true,
  })
  @IsOptional()
  isExternalApi?: boolean = true;
}
