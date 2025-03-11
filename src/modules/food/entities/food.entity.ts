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

  @Column({ type: 'float' , nullable: true})
  fat: number;

  @Column({ type: 'float', nullable: true }) 
cholesterol: number;

@Column({ type: 'float', nullable: true }) 
sodium: number;

@Column({ type: 'float', nullable: true }) 
potassium: number;

@Column({ type: 'float', nullable: true }) 
carbohydrates: number;

@Column({ type: 'float', nullable: true }) 
fiber: number;

@Column({ type: 'float', nullable: true }) 
sugar: number;

@Column({ type: 'float', nullable: true }) 
protein: number;

@Column({ type: 'float', nullable: true }) 
vitamin_a: number;

@Column({ type: 'float', nullable: true }) 
vitamin_c: number;

@Column({ type: 'float', nullable: true }) 
calcium: number;

@Column({ type: 'float', nullable: true }) 
iron: number;

@Column({ type: 'float', nullable: true }) 
servingSize: number;

@Column({ nullable: true }) 
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