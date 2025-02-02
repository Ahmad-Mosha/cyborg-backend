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
    description: "The user's first name",
    example: 'John',
    required: false,
  })
  firstName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "The user's last name",
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: "The user's email address",
    example: 'john.doe@example.com',
    required: false,
  })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "The user's gender",
    example: 'male',
    required: false,
  })
  gender?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "The user's weight in kilograms",
    example: 75.5,
    minimum: 0,
    required: false,
  })
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    description: "The user's height in centimeters",
    example: 180,
    minimum: 0,
    required: false,
  })
  height?: number;

  @IsEnum(UserGoal)
  @IsOptional()
  @ApiProperty({
    description: "The user's fitness goal",
    enum: UserGoal,
    example: UserGoal.WEIGHT_LOSS,
    required: false,
  })
  goal?: UserGoal;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(7)
  @ApiProperty({
    description: "The user's activity level on a scale of 1-7",
    example: 4,
    minimum: 1,
    maximum: 7,
    required: false,
  })
  activityLevel?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "URL of the user's avatar image",
    example: 'https://example.com/avatars/user123.jpg',
    required: false,
  })
  avatarUrl?: string;
}
