import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkoutDay } from './workout-day.entity';
import { WorkoutPlan } from './workout-plan.entity';
import { Exclude, Transform } from 'class-transformer';
import { CompletedExercise } from './completed-exercise.entity';

@Entity('workout_sessions')
export class WorkoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  notes: string;

  @Column({
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value,
    },
  })
  @Transform(({ value }) => {
    if (value instanceof Date) {
      return value.toLocaleString(); // Format: MM/DD/YYYY, HH:MM:SS AM/PM
    }
    return value;
  })
  startTime: Date;

  @Column({
    nullable: true,
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value,
    },
  })
  @Transform(({ value }) => {
    if (value instanceof Date) {
      return value.toLocaleString(); // Format: MM/DD/YYYY, HH:MM:SS AM/PM
    }
    return value;
  })
  endTime: Date;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => WorkoutPlan, { nullable: true })
  plan: WorkoutPlan;

  @ManyToOne(() => WorkoutDay, { nullable: true })
  day: WorkoutDay;

  @OneToMany(() => CompletedExercise, (exercise) => exercise.session, {
    cascade: true,
  })
  exercises: CompletedExercise[];

  @CreateDateColumn()
  @Transform(({ value }) => {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return value;
  })
  createdAt: Date;

  @UpdateDateColumn()
  @Transform(({ value }) => {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return value;
  })
  updatedAt: Date;

  @AfterLoad()
  calculateDuration() {
    if (this.startTime && this.endTime) {
      const start = new Date(this.startTime).getTime();
      const end = new Date(this.endTime).getTime();
      this.durationMinutes = Math.round((end - start) / (1000 * 60));
    }
  }
}
