import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { WorkoutSession } from './workout-session.entity';
import { CompletedSet } from './completed-set.entity';

@Entity('completed_exercises')
export class CompletedExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exerciseOrder: number;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Exercise)
  exercise: Exercise;

  @ManyToOne(() => WorkoutSession, (session) => session.exercises, {
    onDelete: 'CASCADE',
  })
  session: WorkoutSession;

  @OneToMany(() => CompletedSet, (set) => set.completedExercise, {
    cascade: true,
  })
  sets: CompletedSet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
