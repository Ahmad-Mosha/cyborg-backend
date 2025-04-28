import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompletedExercise } from './completed-exercise.entity';
import { SetType } from './exercise-set.entity';

@Entity('completed_sets')
export class CompletedSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  setOrder: number;

  @Column({ nullable: true })
  reps: number;

  @Column('float', { nullable: true })
  weight: number;

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

  @Column({ default: false })
  isCompleted: boolean;

  @ManyToOne(() => CompletedExercise, (exercise) => exercise.sets, {
    onDelete: 'CASCADE',
  })
  completedExercise: CompletedExercise;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
