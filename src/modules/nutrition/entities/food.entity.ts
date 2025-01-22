import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('foods')
export class Food {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'float' })
  servingSize: number;

  @Column()
  servingUnit: string;

  @Column({ type: 'float' })
  calories: number;

  @Column({ type: 'float' })
  protein: number;

  @Column({ type: 'float' })
  carbs: number;

  @Column({ type: 'float' })
  fat: number;

  @Column({ type: 'float', nullable: true })
  fiber: number;

  @Column({ type: 'float', nullable: true })
  sugar: number;

  @Column({ type: 'float', nullable: true })
  sodium: number;

  @Column({ default: false })
  isVerified: boolean;

  @ManyToOne(() => User, { nullable: true })
  creator: User;

  @Column('text', {
    default: '[]',
    transformer: {
      to: (value: string[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
