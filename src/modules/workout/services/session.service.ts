import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutSession } from '../entities/workout-session.entity';
import { WorkoutPlan } from '../entities/workout-plan.entity';
import { WorkoutDay } from '../entities/workout-day.entity';
import { CompletedExercise } from '../entities/completed-exercise.entity';
import { CompletedSet } from '../entities/completed-set.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { SetType } from '../entities/exercise-set.entity';
import { WorkoutSessionResponseDto } from '../dto/workout-session.response.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(WorkoutSession)
    private readonly workoutSessionRepository: Repository<WorkoutSession>,
    @InjectRepository(WorkoutPlan)
    private readonly workoutPlanRepository: Repository<WorkoutPlan>,
    @InjectRepository(WorkoutDay)
    private readonly workoutDayRepository: Repository<WorkoutDay>,
    @InjectRepository(WorkoutExercise)
    private readonly workoutExerciseRepository: Repository<WorkoutExercise>,
    @InjectRepository(CompletedExercise)
    private readonly completedExerciseRepository: Repository<CompletedExercise>,
    @InjectRepository(CompletedSet)
    private readonly completedSetRepository: Repository<CompletedSet>,
  ) {}

  /**
   * Start a new workout session
   */
  async startWorkoutSession(
    userId: string,
    planId?: string,
    dayId?: string,
    name?: string,
    notes?: string,
  ): Promise<WorkoutSession> {
    // Check if the user already has an active session
    const activeSession = await this.getActiveWorkoutSession(userId);
    if (activeSession) {
      throw new BadRequestException(
        'You already have an active workout session. Please complete or cancel it before starting a new one.',
      );
    }

    let plan = null;
    let day = null;

    if (planId) {
      plan = await this.workoutPlanRepository.findOne({
        where: { id: planId, user: { id: userId } },
      });

      if (!plan) {
        throw new NotFoundException(`Workout plan with ID ${planId} not found`);
      }

      if (dayId) {
        day = await this.workoutDayRepository.findOne({
          where: { id: dayId, plan: { id: planId } },
          relations: ['exercises', 'exercises.exercise', 'exercises.sets'],
        });

        if (!day) {
          throw new NotFoundException(
            `Workout day with ID ${dayId} not found in plan ${planId}`,
          );
        }
      }
    }

    const session = this.workoutSessionRepository.create({
      startTime: new Date(),
      user: { id: userId },
      plan: plan ? { id: plan.id } : null,
      day: day ? { id: day.id } : null,
      exercises: [],
      name: name || (day ? day.name : 'Freestyle Workout'),
      notes: notes || '',
    });

    await this.workoutSessionRepository.save(session);

    // If day is specified, pre-populate completed exercises and sets
    if (day) {
      for (const exercise of day.exercises) {
        const completedExercise = this.completedExerciseRepository.create({
          exerciseOrder: exercise.exerciseOrder,
          notes: exercise.notes,
          exercise: exercise.exercise,
          session,
          sets: [],
        });

        // Create sets
        for (const set of exercise.sets) {
          const completedSet = this.completedSetRepository.create({
            setOrder: set.setOrder,
            reps: set.reps,
            weight: set.weight,
            notes: set.notes,
            restTimeSeconds: set.restTimeSeconds || 120,
            type: set.type || SetType.NORMAL,
          });

          completedExercise.sets.push(completedSet);
        }

        await this.completedExerciseRepository.save(completedExercise);
      }
    }

    const savedSession = await this.workoutSessionRepository.findOne({
      where: { id: session.id },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.sets',
        'plan',
        'day',
      ],
    });

    return savedSession;
  }

  /**
   * End a workout session
   */
  async endWorkoutSession(
    userId: string,
    sessionId: string,
    notes?: string,
  ): Promise<WorkoutSession> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId, user: { id: userId }, isCompleted: false },
    });

    if (!session) {
      throw new NotFoundException(
        `Active workout session with ID ${sessionId} not found`,
      );
    }

    session.endTime = new Date();
    session.isCompleted = true;
    if (notes) {
      session.notes = notes;
    }

    // Calculate duration in minutes
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    session.durationMinutes = Math.round((end - start) / (1000 * 60));

    await this.workoutSessionRepository.save(session);

    const completedSession = await this.workoutSessionRepository.findOne({
      where: { id: session.id },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.sets',
        'plan',
        'day',
      ],
    });

    return completedSession;
  }

  /**
   * Get all workout sessions for a user with pagination
   */
  async getUserWorkoutSessions(
    userId: string,
    skip = 0,
    take = 10,
  ): Promise<[WorkoutSession[], number]> {
    return this.workoutSessionRepository.findAndCount({
      where: { user: { id: userId }, isCompleted: true },
      relations: [
        'plan',
        'day',
        'exercises',
        'exercises.exercise',
        'exercises.sets',
      ],
      order: { startTime: 'DESC' },
      skip,
      take,
    });
  }

  /**
   * Get active (not completed) workout session for a user
   */
  async getActiveWorkoutSession(
    userId: string,
  ): Promise<WorkoutSession | null> {
    return this.workoutSessionRepository.findOne({
      where: { user: { id: userId }, isCompleted: false },
      relations: [
        'plan',
        'day',
        'exercises',
        'exercises.exercise',
        'exercises.sets',
      ],
      order: {
        exercises: {
          exerciseOrder: 'ASC',
          sets: {
            setOrder: 'ASC',
          },
        },
      },
    });
  }

  /**
   * Get a workout session by ID
   */
  async getWorkoutSessionById(
    userId: string,
    sessionId: string,
  ): Promise<WorkoutSession> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: [
        'plan',
        'day',
        'exercises',
        'exercises.exercise',
        'exercises.sets',
      ],
      order: {
        exercises: {
          exerciseOrder: 'ASC',
          sets: {
            setOrder: 'ASC',
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(
        `Workout session with ID ${sessionId} not found`,
      );
    }

    return session;
  }

  /**
   * Add a completed exercise to a session
   */
  async addCompletedExercise(
    userId: string,
    sessionId: string,
    workoutExerciseId: string,
  ): Promise<CompletedExercise> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId, user: { id: userId }, isCompleted: false },
      relations: ['exercises'],
    });

    if (!session) {
      throw new NotFoundException(
        `Active workout session with ID ${sessionId} not found`,
      );
    }

    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: { id: workoutExerciseId },
      relations: ['exercise', 'sets'],
    });

    if (!workoutExercise) {
      throw new NotFoundException(
        `Workout exercise with ID ${workoutExerciseId} not found`,
      );
    }

    // We need to add a custom check here as we don't store workoutExerciseId directly
    // Instead, check if an exercise for this workout was already completed
    const existingCompletedExercise = session.exercises.find(
      (ex) => ex.exercise && ex.exercise.id === workoutExercise.exercise.id,
    );

    if (existingCompletedExercise) {
      return existingCompletedExercise;
    }

    // Create a new completed exercise
    const completedExercise = this.completedExerciseRepository.create({
      session,
      exercise: workoutExercise.exercise,
      exerciseOrder: workoutExercise.exerciseOrder,
      notes: workoutExercise.notes,
      sets: [],
    });

    // Create completed sets based on the exercise sets
    for (const set of workoutExercise.sets) {
      const completedSet = this.completedSetRepository.create({
        completedExercise,
        setOrder: set.setOrder,
        reps: set.reps,
        weight: set.weight,
        type: set.type || SetType.NORMAL,
        restTimeSeconds: set.restTimeSeconds || 120,
      });
      completedExercise.sets.push(completedSet);
    }

    return this.completedExerciseRepository.save(completedExercise);
  }

  /**
   * Get a completed set by ID, ensuring it belongs to the user
   */
  async getCompletedSetById(
    userId: string,
    setId: string,
  ): Promise<CompletedSet> {
    const set = await this.completedSetRepository.findOne({
      where: {
        id: setId,
        completedExercise: {
          session: { user: { id: userId } },
        },
      },
      relations: [
        'completedExercise',
        'completedExercise.session',
        'completedExercise.session.user',
      ],
    });

    if (!set) {
      throw new NotFoundException(`Completed set with ID ${setId} not found`);
    }

    return set;
  }

  /**
   * Update a completed set (e.g., mark as completed, update reps or weight)
   */
  async updateCompletedSet(
    userId: string,
    setId: string,
    updateData: Partial<CompletedSet>,
  ): Promise<CompletedSet> {
    const set = await this.completedSetRepository.findOne({
      where: {
        id: setId,
        completedExercise: {
          session: { user: { id: userId }, isCompleted: false },
        },
      },
      relations: [
        'completedExercise',
        'completedExercise.session',
        'completedExercise.session.user',
      ],
    });

    if (!set) {
      throw new NotFoundException(`Completed set with ID ${setId} not found`);
    }

    // Verify the session is still active
    if (set.completedExercise.session.isCompleted) {
      throw new BadRequestException(
        'Cannot update sets in a completed workout session',
      );
    }

    // Update the set with the new data
    Object.assign(set, updateData);

    return this.completedSetRepository.save(set);
  }

  /**
   * Start rest timer for a set
   */
  async startSetRestTimer(
    userId: string,
    setId: string,
  ): Promise<CompletedSet> {
    const set = await this.completedSetRepository.findOne({
      where: { id: setId },
      relations: ['completedExercise', 'completedExercise.session'],
    });

    if (!set) {
      throw new NotFoundException(`Set with ID ${setId} not found`);
    }

    // Verify the set belongs to an active session of the user
    if (
      !set.completedExercise?.session ||
      set.completedExercise.session.user?.id !== userId ||
      set.completedExercise.session.isCompleted
    ) {
      throw new BadRequestException('Cannot start rest timer for this set');
    }

    // Update the set with rest start time
    set.restStartTime = new Date();
    return this.completedSetRepository.save(set);
  }

  /**
   * Get remaining rest time for a set
   */
  async getSetRestTimeRemaining(setId: string): Promise<number> {
    const set = await this.completedSetRepository.findOne({
      where: { id: setId },
    });

    if (!set) {
      throw new NotFoundException(`Set with ID ${setId} not found`);
    }

    if (!set.restStartTime) {
      return set.restTimeSeconds || 0;
    }

    const now = new Date();
    const elapsedSeconds = Math.floor(
      (now.getTime() - set.restStartTime.getTime()) / 1000,
    );
    const remainingSeconds = Math.max(
      0,
      (set.restTimeSeconds || 0) - elapsedSeconds,
    );

    return remainingSeconds;
  }

  /**
   * Delete a workout session
   */
  async deleteWorkoutSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) {
      throw new NotFoundException(
        `Workout session with ID ${sessionId} not found`,
      );
    }

    await this.workoutSessionRepository.remove(session);
  }
}
