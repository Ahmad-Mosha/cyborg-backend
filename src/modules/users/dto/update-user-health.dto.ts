import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateUserHealthDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's age in years",
    example: 30,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  age?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "User's gender",
    example: 'male',
    required: false,
    nullable: true,
    type: String,
    enum: ['male', 'female'],
  })
  gender?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's weight in kilograms",
    example: 75.5,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's height in centimeters",
    example: 180,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  height?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's muscle mass percentage",
    example: 40,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  muscleMass?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @ApiProperty({
    description: "User's body fat percentage",
    example: 15,
    minimum: 0,
    maximum: 100,
    required: false,
    nullable: true,
    type: Number,
  })
  fatPercentage?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @ApiProperty({
    description: "User's body water percentage",
    example: 60,
    minimum: 0,
    maximum: 100,
    required: false,
    nullable: true,
    type: Number,
  })
  waterPercentage?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's Basal Metabolic Rate (BMR) in calories",
    example: 1800,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  bmr?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's Body Mass Index (BMI)",
    example: 24.5,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  bmi?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "User's fitness goals",
    example: 'Build muscle and improve endurance',
    required: false,
    nullable: true,
    type: String,
  })
  fitnessGoals?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's daily calorie goal",
    example: 2500,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  dailyCalorieGoal?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's daily protein goal in grams",
    example: 150,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  dailyProteinGoal?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's daily carbohydrates goal in grams",
    example: 300,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  dailyCarbsGoal?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's daily fat goal in grams",
    example: 70,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  dailyFatGoal?: number;
}
