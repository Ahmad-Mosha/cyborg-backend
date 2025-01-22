import {
  IsBoolean,
  IsOptional,
  IsArray,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  workoutReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  mealReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  goalAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsArray()
  @IsOptional()
  preferredNotificationDays?: string[];

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Preferred notification time must be in HH:mm format',
  })
  preferredNotificationTime?: string;
}
