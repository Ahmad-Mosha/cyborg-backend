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

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('user_data')
export class UserData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ type: 'text', nullable: true })
  gender: Gender;

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

  @Column({ type: 'text', nullable: true })
  workoutLocation: string; 

  @Column('text', { nullable: true })
  additionalNotes: string; 

  @Column('text', {
    nullable: true,
    transformer: {
      to: (value: string[]) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : []),
    },
  })
  availableEquipment: string[];
  
  @Column({ nullable: true })
  fitnessGoals: string;

  @Column({ nullable: true })
  activityLevel: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
