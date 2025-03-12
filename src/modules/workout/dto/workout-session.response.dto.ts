import { ApiProperty } from '@nestjs/swagger';
import { WorkoutSession } from '../entities/workout-session.entity';
import { CompletedExerciseResponseDto } from './completed-exercise.response.dto';

export class WorkoutSessionResponseDto {
  @ApiProperty({ example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901' })
  id: string;

  @ApiProperty({ example: 'Monday Push Session' })
  name: string;

  @ApiProperty({ example: 'Feeling good today!' })
  notes: string;

  @ApiProperty({ example: '3/8/2025, 2:30:00 PM' })
  startTime: string;

  @ApiProperty({ example: '3/8/2025, 3:45:00 PM', required: false })
  endTime?: string;

  @ApiProperty({ example: false })
  isCompleted: boolean;

  @ApiProperty({ example: 75, required: false })
  durationMinutes?: number;

  @ApiProperty({
    example: '1h 15m',
    required: false,
    description: 'Human-readable duration format',
  })
  formattedDuration?: string;

  @ApiProperty({ type: [CompletedExerciseResponseDto] })
  exercises?: CompletedExerciseResponseDto[];

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  planId?: string;

  @ApiProperty({
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
    required: false,
  })
  dayId?: string;

  @ApiProperty({ example: '3/8/2025, 2:30:00 PM' })
  createdAt: string;

  @ApiProperty({ example: '3/8/2025, 3:45:00 PM' })
  updatedAt: string;

  constructor(session: WorkoutSession) {
    this.id = session.id;
    this.name = session.name;
    this.notes = session.notes;
    this.startTime = session.startTime
      ? new Date(session.startTime).toLocaleString()
      : null;
    this.endTime = session.endTime
      ? new Date(session.endTime).toLocaleString()
      : null;
    this.isCompleted = session.isCompleted;
    this.durationMinutes = session.durationMinutes;

    // Add formatted duration (e.g., "1h 15m")
    if (session.durationMinutes) {
      const hours = Math.floor(session.durationMinutes / 60);
      const minutes = session.durationMinutes % 60;

      if (hours > 0 && minutes > 0) {
        this.formattedDuration = `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        this.formattedDuration = `${hours}h`;
      } else {
        this.formattedDuration = `${minutes}m`;
      }
    }

    this.createdAt = session.createdAt
      ? new Date(session.createdAt).toLocaleString()
      : null;
    this.updatedAt = session.updatedAt
      ? new Date(session.updatedAt).toLocaleString()
      : null;

    if (session.plan) {
      this.planId = session.plan.id;
    }

    if (session.day) {
      this.dayId = session.day.id;
    }

    if (session.exercises) {
      this.exercises = session.exercises.map(
        (exercise) => new CompletedExerciseResponseDto(exercise),
      );
    }
  }

  static fromEntity(session: WorkoutSession): WorkoutSessionResponseDto {
    return new WorkoutSessionResponseDto(session);
  }

  static fromEntities(sessions: WorkoutSession[]): WorkoutSessionResponseDto[] {
    return sessions.map((session) =>
      WorkoutSessionResponseDto.fromEntity(session),
    );
  }
}
