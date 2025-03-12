import { 
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn 
} from 'typeorm';
import { Expose } from 'class-transformer';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @CreateDateColumn({ type: 'datetime' })
  @Expose()
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  @Expose()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime' })
  @Expose()
  deletedAt?: Date;
}