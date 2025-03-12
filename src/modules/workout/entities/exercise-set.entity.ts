import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity';

export enum SetType {
  WARM_UP = 'warm_up',
  NORMAL = 'normal',
  SUPER_SET = 'super_set',
  DROP_SET = 'drop_set',
}

@Entity('exercise_sets')
export class ExerciseSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  setOrder: number;

  @Column({ nullable: true })
  reps: number;

  @Column('float', { nullable: true })
  weight: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'int', default: 120 }) // 120 seconds = 2 minutes
  restTimeSeconds: number;

  @Column({ nullable: true })
  restStartTime: Date;

  @Column({
    type: 'text',
    default: SetType.NORMAL,
    transformer: {
      to: (value: SetType) => value,
      from: (value: string) => value as SetType,
    },
  })
  type: SetType;

  @ManyToOne(() => WorkoutExercise, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  workoutExercise: WorkoutExercise;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
