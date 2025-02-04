import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_health')
export class UserHealth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'float', nullable: true })
  weight: number;

  @Column({ type: 'float', nullable: true })
  height: number;

  @Column({ type: 'float', nullable: true })
  muscleMass: number;

  @Column({ type: 'float', nullable: true })
  fatPercentage: number;

  @Column({ type: 'float', nullable: true })
  waterPercentage: number;

  @Column({ type: 'float', nullable: true })
  bmr: number;

  @Column({ type: 'float', nullable: true })
  bmi: number;

  @Column({ nullable: true })
  fitnessGoals: string;
  
  @Column({ nullable: true })
  activityLevel: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
