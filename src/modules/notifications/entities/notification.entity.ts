import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  WORKOUT_REMINDER = 'workout_reminder',
  MEAL_REMINDER = 'meal_reminder',
  ADMIN_ANNOUNCEMENT = 'admin_announcement',
  WORKOUT_GOAL = 'workout_goal',
  NUTRITION_GOAL = 'nutrition_goal',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'simple-enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({
    type: 'simple-enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true })
  scheduledFor: Date;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date;
}
