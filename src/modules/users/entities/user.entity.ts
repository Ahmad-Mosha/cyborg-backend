import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ROLES, UserRole } from '../../../shared/constants/roles.constant';
import { UserData } from './user-data.entity';
import { ChatConversation } from '../../chat/entities/chat-conversation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @OneToOne(() => UserData, (health) => health.user)
  health: UserData;

  // @OneToMany(() => WorkoutRoutine, (routine) => routine.creator)
  // workoutRoutines: WorkoutRoutine[];

  // @OneToMany(() => WorkoutSession, (session) => session.user)
  // workoutSessions: WorkoutSession[];

  // @OneToMany(() => Meal, (meal) => meal.user)
  // meals: Meal[];

  @OneToMany(() => ChatConversation, (conversation) => conversation.user)
  chatConversations: ChatConversation[];

  @Column('text', {
    default: JSON.stringify([ROLES.USER]),
    transformer: {
      to: (value: UserRole[]) =>
        Array.isArray(value) ? JSON.stringify(value) : JSON.stringify([value]),
      from: (value: string) => {
        if (!value) return [ROLES.USER];
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          return [value as UserRole];
        }
      },
    },
  })
  roles: UserRole[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isFirstLogin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  hasRole(role: UserRole): boolean {
    return this.roles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole(ROLES.ADMIN);
  }

  // @Column({ default: true })
  // workoutReminders: boolean;

  // @Column({ default: true })
  // mealReminders: boolean;

  // @Column({ default: true })
  // goalAlerts: boolean;

  // @Column({ default: true })
  // emailNotifications: boolean;

  // @Column('text', {
  //   nullable: true,
  //   transformer: {
  //     to: (value: string[]) => (value ? JSON.stringify(value) : null),
  //     from: (value: string) => (value ? JSON.parse(value) : []),
  //   },
  // })
  // preferredNotificationDays: string[];

  // @Column({ type: 'time', nullable: true })
  // preferredNotificationTime: string;

  // @OneToMany(() => Post, (post) => post.author)
  // posts: Post[];

  // @OneToMany(() => Comment, (comment) => comment.author)
  // comments: Comment[];

  // @OneToMany(() => Like, (like) => like.user)
  // likes: Like[];

  // @OneToMany(() => Notification, (notification) => notification.user)
  // notifications: Notification[];
}
