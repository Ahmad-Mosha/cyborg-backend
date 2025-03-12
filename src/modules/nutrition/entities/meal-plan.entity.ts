import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from '../../users/entities/user.entity';
import { Meal } from './meal.entity';
import { MealCalorieDistribution } from '../interfaces/meal-calorie-distribution.interface';

@Entity('meal_plans')
export class MealPlan extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'float', nullable: true })
  targetCalories: number;

  @Column({ type: 'json', nullable: true })
  calorieDistribution: MealCalorieDistribution[];

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Meal, meal => meal.mealPlan, { cascade: true })
  meals: Meal[];
}