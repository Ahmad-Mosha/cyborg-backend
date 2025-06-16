import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWeightDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: "User's new weight in kilograms",
    example: 75.5,
    minimum: 0,
    type: Number,
  })
  weight: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Optional note about the weight entry',
    example: 'After morning workout',
    required: false,
    type: String,
  })
  note?: string;
}
