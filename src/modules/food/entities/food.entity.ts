import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('food')
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fdcId: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  brandOwner: string;

  @Column({ type: 'json', nullable: true })
  nutrients: any;

  @Column()
  category: string;

  @Column({ type: 'json', nullable: true })
  portions: any;
}
