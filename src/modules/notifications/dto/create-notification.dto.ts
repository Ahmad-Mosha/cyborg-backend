import {
  IsString,
  IsEnum,
  IsOptional,
  IsDate,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationType,
  NotificationPriority,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  scheduledFor?: Date;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
