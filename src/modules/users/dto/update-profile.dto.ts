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
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  height?: number;

  @IsEnum(UserGoal)
  @IsOptional()
  goal?: UserGoal;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(7)
  activityLevel?: number;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
