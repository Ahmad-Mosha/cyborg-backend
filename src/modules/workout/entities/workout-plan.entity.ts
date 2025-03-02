import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutDay } from './workout-day.entity';

@Entity()
export class WorkoutPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.workoutPlans)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => WorkoutDay, (workoutDay) => workoutDay.workoutPlan)
  workoutDays: WorkoutDay[];
}
