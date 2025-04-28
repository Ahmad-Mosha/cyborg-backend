import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSession } from '../entities/workout-session.entity';
import { CompletedExercise } from '../entities/completed-exercise.entity';
import { CompletedSet } from '../entities/completed-set.entity';

export interface WorkoutStats {
  totalWorkouts: number;
  totalWorkoutTime: number; // in minutes
  averageWorkoutTime: number; // in minutes
  completedExercises: number;
  totalSets: number;
  mostFrequentExercises: Array<{
    exerciseId: string;
    exerciseName: string;
    count: number;
  }>;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  sessions: Array<{
    sessionId: string;
    date: Date;
    maxWeight: number;
    totalReps: number;
    totalSets: number;
  }>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly workoutSessionRepository: Repository<WorkoutSession>,
    @InjectRepository(CompletedExercise)
    private readonly completedExerciseRepository: Repository<CompletedExercise>,
    @InjectRepository(CompletedSet)
    private readonly completedSetRepository: Repository<CompletedSet>,
  ) {}

  /**
   * Get user workout statistics for a given time period
   */
  async getWorkoutStats(
    userId: string,
    dateRange?: DateRange,
  ): Promise<WorkoutStats> {
    // Build the query with date filtering if provided
    const query = this.workoutSessionRepository
      .createQueryBuilder('session')
      .where('session.user.id = :userId', { userId })
      .andWhere('session.isCompleted = true');

    if (dateRange) {
      query
        .andWhere('session.startTime >= :startDate', {
          startDate: dateRange.startDate,
        })
        .andWhere('session.startTime <= :endDate', {
          endDate: dateRange.endDate,
        });
    }

    // Get the sessions
    const sessions = await query
      .leftJoinAndSelect('session.exercises', 'exercise')
      .getMany();

    // Calculate workout stats
    const totalWorkouts = sessions.length;
    const totalWorkoutTime = sessions.reduce(
      (total, session) => total + (session.durationMinutes || 0),
      0,
    );
    const averageWorkoutTime =
      totalWorkouts > 0 ? totalWorkoutTime / totalWorkouts : 0;

    // Count completed exercises and sets
    let completedExercises = 0;
    let totalSets = 0;
    const exerciseCounts = new Map<string, { count: number; name: string }>();

    for (const session of sessions) {
      if (session.exercises) {
        completedExercises += session.exercises.length;

        for (const exercise of session.exercises) {
          // Count sets
          totalSets += exercise.sets?.length || 0;

          // Track exercise frequencies
          const exerciseId = exercise.exercise?.id;
          const exerciseName = exercise.exercise?.name || 'Unknown';

          if (exerciseId) {
            const current = exerciseCounts.get(exerciseId) || {
              count: 0,
              name: exerciseName,
            };
            current.count += 1;
            exerciseCounts.set(exerciseId, current);
          }
        }
      }
    }

    // Get most frequent exercises
    const mostFrequentExercises = Array.from(exerciseCounts.entries())
      .map(([exerciseId, { count, name }]) => ({
        exerciseId,
        exerciseName: name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 most frequent

    return {
      totalWorkouts,
      totalWorkoutTime,
      averageWorkoutTime,
      completedExercises,
      totalSets,
      mostFrequentExercises,
    };
  }

  /**
   * Get progress data for a specific exercise over time
   */
  async getExerciseProgress(
    userId: string,
    exerciseId: string,
    dateRange?: DateRange,
  ): Promise<ExerciseProgress> {
    // Build the query with date filtering if provided
    const query = this.completedExerciseRepository
      .createQueryBuilder('exercise')
      .innerJoin('exercise.session', 'session')
      .where('session.user.id = :userId', { userId })
      .andWhere('exercise.exercise.id = :exerciseId', { exerciseId })
      .andWhere('session.isCompleted = true');

    if (dateRange) {
      query
        .andWhere('session.startTime >= :startDate', {
          startDate: dateRange.startDate,
        })
        .andWhere('session.startTime <= :endDate', {
          endDate: dateRange.endDate,
        });
    }

    // Get the completed exercises with their sets
    const completedExercises = await query
      .leftJoinAndSelect('exercise.sets', 'set')
      .leftJoinAndSelect('exercise.session', 'workoutSession')
      .leftJoinAndSelect('exercise.exercise', 'exerciseEntity')
      .orderBy('workoutSession.startTime', 'ASC')
      .getMany();

    if (completedExercises.length === 0) {
      return {
        exerciseId,
        exerciseName: 'Unknown', // We don't have the name if no exercises were found
        sessions: [],
      };
    }

    // Group sets by session
    const sessionData = new Map<
      string,
      {
        date: Date;
        maxWeight: number;
        totalReps: number;
        totalSets: number;
      }
    >();

    for (const completedExercise of completedExercises) {
      const sessionId = completedExercise.session.id;
      const date = completedExercise.session.startTime;

      let maxWeight = 0;
      let totalReps = 0;
      let totalSets = 0;

      if (completedExercise.sets) {
        for (const set of completedExercise.sets) {
          if (set.weight !== null && set.weight > maxWeight) {
            maxWeight = set.weight;
          }
          totalReps += set.reps || 0;
          totalSets += 1;
        }
      }

      sessionData.set(sessionId, {
        date,
        maxWeight,
        totalReps,
        totalSets,
      });
    }

    // Convert to array format for the response
    const exerciseName =
      completedExercises[0]?.exercise?.name || 'Unknown Exercise';
    const sessions = Array.from(sessionData.entries()).map(
      ([sessionId, data]) => ({
        sessionId,
        ...data,
      }),
    );

    return {
      exerciseId,
      exerciseName,
      sessions,
    };
  }

  /**
   * Get session trends over time, such as frequency and duration
   */
  async getSessionTrends(
    userId: string,
    dateRange?: DateRange,
  ): Promise<
    Array<{
      year: number;
      month: number;
      workouts: number;
      totalDuration: number;
      averageDuration: number;
    }>
  > {
    // Build the query with date filtering if provided
    const query = this.workoutSessionRepository
      .createQueryBuilder('session')
      .select([
        "strftime('%Y', session.startTime) AS year", // Use strftime for SQLite
        "strftime('%m', session.startTime) AS month", // Use strftime for SQLite
        'COUNT(session.id) AS workouts',
        'SUM(session.durationMinutes) AS totalDuration',
        'AVG(session.durationMinutes) AS averageDuration',
      ])
      .where('session.user.id = :userId', { userId })
      .andWhere('session.isCompleted = true')
      .groupBy('year, month') // Group by the extracted year and month
      .orderBy('year, month');

    if (dateRange) {
      query
        .andWhere('session.startTime >= :startDate', {
          startDate: dateRange.startDate,
        })
        .andWhere('session.startTime <= :endDate', {
          endDate: dateRange.endDate,
        });
    }

    const results = await query.getRawMany();

    return results.map((row) => ({
      year: parseInt(row.year, 10),
      month: parseInt(row.month, 10),
      workouts: parseInt(row.workouts, 10),
      totalDuration: parseInt(row.totalDuration, 10) || 0,
      averageDuration: parseFloat(row.averageDuration) || 0,
    }));
  }

  /**
   * Get user's personal records (PRs) for exercises
   */
  async getPersonalRecords(
    userId: string,
    limit = 10,
  ): Promise<
    Array<{
      exerciseId: string;
      exerciseName: string;
      maxWeight: number;
      date: Date;
    }>
  > {
    // Find the max weight for each exercise
    const query = this.completedSetRepository
      .createQueryBuilder('set')
      .select([
        'exerciseEntity.id AS exerciseId',
        'exerciseEntity.name AS exerciseName',
        'MAX(set.weight) AS maxWeight',
        'MAX(session.startTime) AS date',
      ])
      .innerJoin('set.completedExercise', 'completedExercise')
      .innerJoin('completedExercise.exercise', 'exerciseEntity')
      .innerJoin('completedExercise.session', 'session')
      .where('session.user.id = :userId', { userId })
      .andWhere('session.isCompleted = true')
      .andWhere('set.weight IS NOT NULL')
      .groupBy('exerciseEntity.id, exerciseEntity.name')
      .orderBy('MAX(set.weight)', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    return results.map((row) => ({
      exerciseId: row.exerciseId,
      exerciseName: row.exerciseName,
      maxWeight: parseFloat(row.maxWeight),
      date: row.date,
    }));
  }
}
