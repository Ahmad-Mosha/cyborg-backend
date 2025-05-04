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
    description: "User's profile picture URL",
    example: 'https://bucket-name.s3.region.amazonaws.com/uploads/uuid.jpg',
    required: false,
    nullable: true,
    type: String,
  })
  profilePictureUrl?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "User's profile picture key in storage",
    example: 'uploads/uuid.jpg',
    required: false,
    nullable: true,
    type: String,
  })
  profilePictureKey?: string;
}

