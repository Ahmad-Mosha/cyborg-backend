import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { WorkoutDay } from '../entities/workout-day.entity';
import { AddWorkoutExerciseDto } from '../dto/add-workout-exercise.dto';
import { ExerciseSet, SetType } from '../entities/exercise-set.entity';
import { ExercisesService } from '../../exercises/exercises.service';
import { Exercise } from '@modules/exercises/entities/exercise.entity';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(WorkoutExercise)
    private readonly workoutExerciseRepository: Repository<WorkoutExercise>,
    @InjectRepository(WorkoutDay)
    private readonly workoutDayRepository: Repository<WorkoutDay>,
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(ExerciseSet)
    private readonly exerciseSetRepository: Repository<ExerciseSet>,
    private readonly exercisesService: ExercisesService,
  ) {}

  /**
   * Add an exercise to a workout day
   */
  async addWorkoutExercise(
    userId: string,
    dayId: string,
    exerciseDto: AddWorkoutExerciseDto,
  ): Promise<WorkoutExercise> {
    const day = await this.workoutDayRepository.findOne({
      where: { id: dayId, plan: { user: { id: userId } } },
    });

    if (!day) {
      throw new NotFoundException(`Workout day with ID ${dayId} not found`);
    }

    // Check if exercise exists in database, if not fetch from API
    let exercise = await this.exerciseRepository.findOne({
      where: { id: exerciseDto.exerciseId },
    });

    if (!exercise && exerciseDto.exerciseId) {
      // Fetch from external API using exercisesService
      try {
        exercise = await this.exercisesService.getExerciseById(
          exerciseDto.exerciseId,
        );
      } catch (error) {
        throw new NotFoundException(
          `Exercise with ID ${exerciseDto.exerciseId} not found`,
        );
      }
    }

    // Create workout exercise entity
    const workoutExercise = this.workoutExerciseRepository.create({
      exerciseOrder: exerciseDto.exerciseOrder,
      day,
      exercise,
      sets: [],
      notes: exerciseDto.notes,
    });

    // Add default set
    const defaultSet = this.exerciseSetRepository.create({
      setOrder: 1,
      reps: 10,
      type: SetType.NORMAL,
      workoutExercise,
    });
    workoutExercise.sets = [defaultSet];


    return this.workoutExerciseRepository.save(workoutExercise);
  }

  /**
   * Delete a workout exercise
   */
  async deleteWorkoutExercise(
    userId: string,
    exerciseId: string,
  ): Promise<void> {
    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: { id: exerciseId, day: { plan: { user: { id: userId } } } },
    });

    if (!workoutExercise) {
      throw new NotFoundException(
        `Workout exercise with ID ${exerciseId} not found`,
      );
    }

    await this.workoutExerciseRepository.remove(workoutExercise);
  }

  /**
   * Update an exercise set
   */
  async updateExerciseSet(
    userId: string,
    setId: string,
    updateData: Partial<ExerciseSet>,
  ): Promise<ExerciseSet> {
    const set = await this.exerciseSetRepository.findOne({
      where: {
        id: setId,
        workoutExercise: { day: { plan: { user: { id: userId } } } },
      },
      relations: ['workoutExercise'],
    });

    if (!set) {
      throw new NotFoundException(`Exercise set with ID ${setId} not found`);
    }

    // Update the set with the new data
    Object.assign(set, updateData);

    return this.exerciseSetRepository.save(set);
  }

  /**
   * Add sets to a workout exercise
   */
  async addExerciseSets(
    userId: string,
    exerciseId: string,
    sets: Array<Partial<ExerciseSet>>,
  ): Promise<WorkoutExercise> {
    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: { id: exerciseId, day: { plan: { user: { id: userId } } } },
      relations: ['sets'],
    });

    if (!workoutExercise) {
      throw new NotFoundException(
        `Workout exercise with ID ${exerciseId} not found`,
      );
    }

    // Create and add new sets
    for (const setData of sets) {
      const set = this.exerciseSetRepository.create({
        setOrder: setData.setOrder || workoutExercise.sets.length + 1,
        reps: setData.reps,
        weight: setData.weight,
        type: setData.type || SetType.NORMAL,
        restTimeSeconds: setData.restTimeSeconds || 120,
        workoutExercise,
      });
      workoutExercise.sets.push(set);
    }

    return this.workoutExerciseRepository.save(workoutExercise);
  }

  /**
   * Delete an exercise set
   */
  async deleteExerciseSet(userId: string, setId: string): Promise<void> {
    const set = await this.exerciseSetRepository.findOne({
      where: {
        id: setId,
        workoutExercise: { day: { plan: { user: { id: userId } } } },
      },
    });

    if (!set) {
      throw new NotFoundException(`Exercise set with ID ${setId} not found`);
    }

    await this.exerciseSetRepository.remove(set);
  }

  /**
   * Get an exercise by ID with all sets
   */
  async getWorkoutExerciseById(
    userId: string,
    exerciseId: string,
  ): Promise<WorkoutExercise> {
    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: { id: exerciseId, day: { plan: { user: { id: userId } } } },
      relations: ['sets', 'exercise'],
      order: {
        sets: {
          setOrder: 'ASC',
        },
      },
    });

    if (!workoutExercise) {
      throw new NotFoundException(
        `Workout exercise with ID ${exerciseId} not found`,
      );
    }

    return workoutExercise;
  }
}
