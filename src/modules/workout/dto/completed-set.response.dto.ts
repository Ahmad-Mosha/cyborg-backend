import { ApiProperty } from '@nestjs/swagger';
import { CompletedSet } from '../entities/completed-set.entity';

export class CompletedSetResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 1 })
  setOrder: number;

  @ApiProperty({ example: 12 })
  reps: number;

  @ApiProperty({ example: 50 })
  weight: number;

  @ApiProperty({ example: 'Warm-up set', required: false })
  notes?: string;

  constructor(set: CompletedSet) {
    this.id = set.id;
    this.setOrder = set.setOrder;
    this.reps = set.reps;
    this.weight = set.weight;
    this.notes = set.notes;
  }
}
