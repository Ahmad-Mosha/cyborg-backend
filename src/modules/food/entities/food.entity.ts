import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('foods')
export class Food {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'float' })
  fat: number;

  @Column({ type: 'float' })
  cholesterol: number;

  @Column({ type: 'float' })
  sodium: number;

  @Column({ type: 'float' })
  potassium: number;

  @Column({ type: 'float' })
  carbohydrates: number;

  @Column({ type: 'float' })
  fiber: number;

  @Column({ type: 'float' })
  sugar: number;

  @Column({ type: 'float' })
  protein: number;

  @Column({ type: 'float' })
  vitamin_a: number;

  @Column({ type: 'float' })
  vitamin_c: number;

  @Column({ type: 'float' })
  calcium: number;

  @Column({ type: 'float' })
  iron: number;

  @Column({ type: 'float' })
  servingSize: number;

  @Column()
  servingUnit: string;

  @Column({ type: 'text', nullable: true })
  usdaId: string;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}