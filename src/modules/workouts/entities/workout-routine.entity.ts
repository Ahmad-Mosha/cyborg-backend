import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Exercise } from './exercise.entity';

@Entity('workout_routines')
export class WorkoutRoutine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isPublic: boolean;

  @ManyToOne(() => User, (user) => user.workoutRoutines)
  creator: User;

  @OneToMany(() => Exercise, (exercise) => exercise.routine, { cascade: true })
  exercises: Exercise[];

  @Column('text', {
    default: '[]',
    transformer: {
      to: (value: string[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  tags: string[];

  @Column({ default: 0 })
  estimatedDuration: number; // in minutes

  @Column({ default: 0 })
  difficulty: number; // 1-5 scale

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
