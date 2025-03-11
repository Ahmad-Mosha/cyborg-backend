import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Meal } from './meal.entity';
import { Food } from '../../food/entities/food.entity';
import { BaseEntity } from './base.entity';
import { NutrientColumns } from './embedded/nutrient-columns.entity';

@Entity('meal_foods')
export class MealFood extends BaseEntity {
  @Column(() => NutrientColumns)
  nutrients: NutrientColumns;

  @Column({ type: 'float' })
  servingSize: number;

  @Column({ default: 'g' })
  servingUnit: string;

  @Column({ type: 'boolean', default: false })
  eaten: boolean;

  @Index('idx_meal_food_eaten_at')
  @Column({ type: 'datetime', nullable: true })
  eatenAt: Date;

  @ManyToOne(() => Meal, meal => meal.mealFoods, { onDelete: 'CASCADE' })
  meal: Meal;

  @ManyToOne(() => Food, { onDelete: 'CASCADE' })
  food: Food;
}