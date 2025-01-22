import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ROLES, UserRole } from '../../../shared/constants/roles.constant';
import { WorkoutRoutine } from '../../workouts/entities/workout-routine.entity';
import { WorkoutSession } from '../../workouts/entities/workout-session.entity';
import { Post } from '../../community/entities/post.entity';
import { Comment } from '../../community/entities/comment.entity';
import { Like } from '../../community/entities/like.entity';
import { Meal } from '../../nutrition/entities/meal.entity';
import { Notification } from '../../notifications/entities/notification.entity';

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

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'float', nullable: true })
  weight: number;

  @Column({ type: 'float', nullable: true })
  height: number;

  @Column({ nullable: true })
  fitnessGoals: string;

  @Column({ type: 'float', nullable: true })
  muscleMass: number;

  @Column({ type: 'float', nullable: true })
  fatPercentage: number;

  @Column({ type: 'float', nullable: true })
  waterPercentage: number;

  @Column({ type: 'float', nullable: true })
  dailyCalorieGoal: number;

  @Column({ type: 'float', nullable: true })
  dailyProteinGoal: number;

  @Column({ type: 'float', nullable: true })
  dailyCarbsGoal: number;

  @Column({ type: 'float', nullable: true })
  dailyFatGoal: number;

  @Column({ default: true })
  workoutReminders: boolean;

  @Column({ default: true })
  mealReminders: boolean;

  @Column({ default: true })
  goalAlerts: boolean;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column('text', {
    nullable: true,
    transformer: {
      to: (value: string[]) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : []),
    },
  })
  preferredNotificationDays: string[];

  @Column({ type: 'time', nullable: true })
  preferredNotificationTime: string;

  @OneToMany(() => WorkoutRoutine, (routine) => routine.creator)
  workoutRoutines: WorkoutRoutine[];

  @OneToMany(() => WorkoutSession, (session) => session.user)
  workoutSessions: WorkoutSession[];

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Meal[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @Column('text', {
    default: JSON.stringify([ROLES.USER]),
    transformer: {
      to: (value: UserRole[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  roles: UserRole[];

  @Column({ default: true })
  isActive: boolean;

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
}
