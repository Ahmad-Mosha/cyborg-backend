import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDate,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum UserGoal {
  WEIGHT_LOSS = 'WEIGHT_LOSS',
  MUSCLE_GAIN = 'MUSCLE_GAIN',
  MAINTENANCE = 'MAINTENANCE',
  GENERAL_FITNESS = 'GENERAL_FITNESS',
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "User's first name",
    example: 'John',
    required: false,
    nullable: true,
    type: String,
  })
  firstName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "User's last name",
    example: 'Doe',
    required: false,
    nullable: true,
    type: String,
  })
  lastName?: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: "User's email address",
    example: 'john.doe@example.com',
    required: false,
    nullable: true,
    type: String,
    format: 'email',
  })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "User's gender",
    example: 'male',
    required: false,
    nullable: true,
    type: String,
    enum: ['male', 'female', 'other'],
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

  @IsEnum(UserGoal)
  @IsOptional()
  @ApiProperty({
    description: "User's fitness goal",
    enum: UserGoal,
    example: UserGoal.WEIGHT_LOSS,
    required: false,
    nullable: true,
    enumName: 'UserGoal',
  })
  goal?: UserGoal;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(7)
  @ApiProperty({
    description:
      "User's activity level on a scale of 1-7 (1: Sedentary, 7: Very active)",
    example: 4,
    minimum: 1,
    maximum: 7,
    required: false,
    nullable: true,
    type: Number,
  })
  activityLevel?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "URL of the user's avatar image",
    example: 'https://example.com/avatars/user123.jpg',
    required: false,
    nullable: true,
    type: String,
    format: 'uri',
  })
  avatarUrl?: string;
}
