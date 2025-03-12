import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkoutPlan } from './workout-plan.entity';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('workout_days')
export class WorkoutDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  dayOrder: number;

  @ManyToOne(() => WorkoutPlan, (plan) => plan.days, { onDelete: 'CASCADE' })
  plan: WorkoutPlan;

  @OneToMany(() => WorkoutExercise, (exercise) => exercise.day, {
    cascade: ['insert', 'update', 'remove'],
    onDelete: 'CASCADE',
  })
  exercises: WorkoutExercise[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
