import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkoutDay } from './workout-day.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { ExerciseSet } from './exercise-set.entity';

@Entity('workout_exercises')
export class WorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exerciseOrder: number;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Exercise)
  exercise: Exercise;

  @ManyToOne(() => WorkoutDay, (day) => day.exercises, { onDelete: 'CASCADE' })
  day: WorkoutDay;

  @OneToMany(() => ExerciseSet, (set) => set.workoutExercise, {
    cascade: true,
  })
  sets: ExerciseSet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
