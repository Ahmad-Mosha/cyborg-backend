import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutPlan } from './workout-plan.entity';

@Entity()
export class WorkoutDay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @ManyToOne(() => WorkoutPlan, (workoutPlan) => workoutPlan.workoutDays)
  @JoinColumn({ name: 'workoutPlanId' })
  workoutPlan: WorkoutPlan;
}
