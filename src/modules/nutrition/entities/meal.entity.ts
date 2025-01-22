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
import { MealFood } from './meal-food.entity';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: MealType,
    default: MealType.SNACK,
  })
  type: MealType;

  @Column({ type: 'datetime' })
  consumedAt: Date;

  @ManyToOne(() => User, (user) => user.meals)
  user: User;

  @OneToMany(() => MealFood, (mealFood) => mealFood.meal, { cascade: true })
  mealFoods: MealFood[];

  @Column({ type: 'float', default: 0 })
  totalCalories: number;

  @Column({ type: 'float', default: 0 })
  totalProtein: number;

  @Column({ type: 'float', default: 0 })
  totalCarbs: number;

  @Column({ type: 'float', default: 0 })
  totalFat: number;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
