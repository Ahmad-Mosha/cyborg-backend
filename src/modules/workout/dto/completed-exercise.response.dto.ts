import { ApiProperty } from '@nestjs/swagger';
import { CompletedExercise } from '../entities/completed-exercise.entity';
import { CompletedSetResponseDto } from './completed-set.response.dto';

export class CompletedExerciseResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 1 })
  exerciseOrder: number;

  @ApiProperty({ example: 'Focus on form', required: false })
  notes?: string;

  @ApiProperty({
    example: {
      id: '0001',
      name: 'Bench Press',
      bodyPart: 'chest',
      equipment: 'barbell',
      gifUrl: '/api/exercises/gif/0001',
      target: 'pectorals',
    },
  })
  exercise: any;

  @ApiProperty({ type: [CompletedSetResponseDto] })
  sets: CompletedSetResponseDto[];

  constructor(completedExercise: CompletedExercise) {
    this.id = completedExercise.id;
    this.exerciseOrder = completedExercise.exerciseOrder;
    this.notes = completedExercise.notes;

    if (completedExercise.exercise) {
      this.exercise = {
        id: completedExercise.exercise.id,
        name: completedExercise.exercise.name,
        bodyPart: completedExercise.exercise.bodyPart,
        equipment: completedExercise.exercise.equipment,
        target: completedExercise.exercise.target,
        gifUrl: `/api/exercises/gif/${completedExercise.exercise.id}`,
      };
    }

    if (completedExercise.sets) {
      this.sets = completedExercise.sets.map(
        (set) => new CompletedSetResponseDto(set),
      );
    } else {
      this.sets = [];
    }
  }
}
