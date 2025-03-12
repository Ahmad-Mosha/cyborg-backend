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
import { WorkoutDay } from './workout-day.entity';

export enum PlanType {
  CUSTOM = 'custom',
  AI_GENERATED = 'ai_generated',
}

@Entity('workout_plans')
export class WorkoutPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'text',
    default: PlanType.CUSTOM,
    transformer: {
      to: (value: PlanType) => value,
      from: (value: string) => value as PlanType,
    },
  })
  type: PlanType;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => WorkoutDay, (day) => day.plan, {
    cascade: ['insert', 'update', 'remove'],
    onDelete: 'CASCADE',
  })
  days: WorkoutDay[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
