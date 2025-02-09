import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Exercise } from './exercise.entity';
import { User } from '../../users/entities/user.entity';

@Entity('user_exercises')
export class UserExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exercise)
  exercise: Exercise;

  @ManyToOne(() => User)
  user: User;

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ default: false })
  isCustom: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
