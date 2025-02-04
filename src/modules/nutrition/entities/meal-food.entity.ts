// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
// } from 'typeorm';
// import { Meal } from './meal.entity';
// import { Food } from './food.entity';

// @Entity('meal_foods')
// export class MealFood {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ManyToOne(() => Meal, (meal) => meal.mealFoods)
//   meal: Meal;

//   @ManyToOne(() => Food)
//   food: Food;

//   @Column({ type: 'float' })
//   servingSize: number;

//   @Column()
//   servingUnit: string;

//   @Column({ type: 'float' })
//   calories: number;

//   @Column({ type: 'float' })
//   protein: number;

//   @Column({ type: 'float' })
//   carbs: number;

//   @Column({ type: 'float' })
//   fat: number;

//   @CreateDateColumn()
//   createdAt: Date;
// }
