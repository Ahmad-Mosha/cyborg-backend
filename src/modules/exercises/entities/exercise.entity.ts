import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  bodyPart: string;

  @Column()
  equipment: string;

  @Column()
  gifUrl: string;

  @Column()
  target: string;

  @Column('simple-array')
  secondaryMuscles: string[];

  @Column('simple-array')
  instructions: string[];

  @Column({ default: false })
  isCustom: boolean;
}
