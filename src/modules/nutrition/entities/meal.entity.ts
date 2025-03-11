import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MealPlan } from './meal-plan.entity';
import { MealFood } from './meal-food.entity';
import { NutrientColumns } from './embedded/nutrient-columns.entity';

@Entity('meals')
export class Meal extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'float', nullable: true })
  targetCalories: number;

  @Column({ type: 'json', nullable: true })
  nutritionGoals: {
    protein: number;
    carbs: number;
    fat: number;
  };

  @Index('idx_meal_target_time')
  @Column({ type: 'time' })
  targetTime: Date;

  @Column({ type: 'boolean', default: false })
  eaten: boolean;

  @Column({ type: 'datetime', nullable: true })
  eatenAt: Date;

  @Column(() => NutrientColumns)
  nutrients: NutrientColumns;

  @ManyToOne(() => MealPlan, mealPlan => mealPlan.meals, { onDelete: 'CASCADE' })
  mealPlan: MealPlan;

  @OneToMany(() => MealFood, mealFood => mealFood.meal, { cascade: true })
  mealFoods: MealFood[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}