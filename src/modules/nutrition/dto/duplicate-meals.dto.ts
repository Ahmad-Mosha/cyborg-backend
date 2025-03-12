import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DuplicateMealsDto {
  @ApiProperty({
    description: 'Source meal plan ID',
    required: false
  })
  @IsString()
  @IsOptional()
  sourceMealPlanId?: string;

  @ApiProperty({
    description: 'Target meal plan ID (if duplicating to existing plan)',
    required: false
  })
  @IsString()
  @IsOptional()
  targetMealPlanId?: string;

  @ApiProperty({
    description: 'Target date for the new meals',
    required: false,
    type: Date
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  targetDate?: Date;
}