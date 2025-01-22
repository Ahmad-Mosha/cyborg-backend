import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkoutRoutine } from './workout-routine.entity';
import { ExerciseSet } from './exercise-set.entity';

@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.workoutSessions)
  user: User;

  @ManyToOne(() => WorkoutRoutine)
  routine: WorkoutRoutine;

  @OneToMany(() => ExerciseSet, (set) => set.session, { cascade: true })
  sets: ExerciseSet[];

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'float', nullable: true })
  userWeight: number; // User's weight at the time of workout

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  mood: number; // 1-5 scale

  @Column({ nullable: true })
  energyLevel: number; // 1-5 scale

  @CreateDateColumn()
  createdAt: Date;
}
