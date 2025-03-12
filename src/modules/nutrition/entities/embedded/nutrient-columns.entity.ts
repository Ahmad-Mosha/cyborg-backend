import { Column } from 'typeorm';

export class NutrientColumns {
  @Column({ type: 'float', nullable: true, default: null })
  calories: number;

  @Column({ type: 'float', nullable: true, default: null })
  protein: number;

  @Column({ type: 'float', nullable: true, default: null })
  carbohydrates: number;

  @Column({ type: 'float', nullable: true, default: null })
  fat: number;

  @Column({ type: 'float', nullable: true, default: null })
  fiber: number;

  @Column({ type: 'float', nullable: true, default: null })
  sugar: number;

  @Column({ type: 'float', nullable: true, default: null })
  sodium: number;

  @Column({ type: 'float', nullable: true, default: null })
  cholesterol: number;
}


