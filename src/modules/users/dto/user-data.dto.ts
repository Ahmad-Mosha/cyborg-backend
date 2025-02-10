import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  IsArray,
  IsIn,
} from 'class-validator';

export class UserDataDto {
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

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "User's activity level",
    example: 'Moderate',
    required: false,
    nullable: true,
    type: String,
  })
  activityLevel?: string;

  @IsString()
  @IsOptional()
  @IsIn(['gym', 'home'])
  @ApiProperty({
    description: "User's preferred workout location",
    example: 'gym',
    required: false,
    nullable: true,
    enum: ['gym', 'home'],
  })
  workoutLocation?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'Additional notes about health conditions, injuries, or preferences',
    example: 'I have a knee injury and prefer a low-impact workout.',
    required: false,
    nullable: true,
    type: String,
  })
  additionalNotes?: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'List of available workout equipment at home',
    example: ['dumbbells', 'resistance bands', 'pull-up bar'],
    required: false,
    nullable: true,
    type: [String],
  })
  availableEquipment?: string[];
}
