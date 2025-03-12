import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompletedExercise } from './completed-exercise.entity';

@Entity('completed_sets')
export class CompletedSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  setOrder: number;

  @Column()
  reps: number;

  @Column('float')
  weight: number;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => CompletedExercise, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  completedExercise: CompletedExercise;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
