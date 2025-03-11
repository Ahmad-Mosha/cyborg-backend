import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkFoodEatenDto {
  @ApiProperty({
    description: 'Whether the food has been eaten',
    example: true
  })
  @IsBoolean()
  eaten: boolean;
}