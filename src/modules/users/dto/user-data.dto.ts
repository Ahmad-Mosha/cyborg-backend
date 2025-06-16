import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  IsArray,
  IsIn,
  IsEnum,
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { Gender } from '../entities/user-data.entity';

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

  @IsEnum(Gender)
  @IsOptional()
  @ApiProperty({
    description: "User's gender",
    example: 'male',
    required: false,
    nullable: true,
    enum: Gender,
  })
  gender?: Gender;

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

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.weight || !obj.height) return null;
    return Number((obj.weight / Math.pow(obj.height / 100, 2)).toFixed(1));
  })
  @ApiProperty({
    description: "User's Body Mass Index (BMI)",
    example: 24.5,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  bmi?: number;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.weight || !obj.height || !obj.age || !obj.gender) return null;

    // Using Mifflin-St Jeor Formula
    let bmr = 10 * obj.weight + 6.25 * obj.height - 5 * obj.age;

    if (obj.gender === Gender.MALE) {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    return Math.round(bmr);
  })
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
    description: "User's waist measurement in centimeters",
    example: 85,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  waist?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's chest measurement in centimeters",
    example: 95,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  chest?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's hips measurement in centimeters",
    example: 90,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  hips?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's neck measurement in centimeters",
    example: 38,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  neck?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "User's shoulders measurement in centimeters",
    example: 110,
    minimum: 0,
    required: false,
    nullable: true,
    type: Number,
  })
  shoulders?: number;

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

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Nationality of the user',
    example: 'American',
    required: false,
    nullable: true,
    type: String,
  })
  nationality?: string;
}
