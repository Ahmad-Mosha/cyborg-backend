import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

@Entity('exercise_sets')
export class ExerciseSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  setOrder: number;

  @Column()
  reps: number;

  @Column('float')
  weight: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => WorkoutExercise, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  workoutExercise: WorkoutExercise;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
