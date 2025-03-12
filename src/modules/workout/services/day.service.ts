import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutDay } from '../entities/workout-day.entity';
import { WorkoutPlan } from '../entities/workout-plan.entity';
import { AddWorkoutDayDto } from '../dto/add-workout-day.dto';

@Injectable()
export class DayService {
  constructor(
    @InjectRepository(WorkoutDay)
    private readonly workoutDayRepository: Repository<WorkoutDay>,
    @InjectRepository(WorkoutPlan)
    private readonly workoutPlanRepository: Repository<WorkoutPlan>,
  ) {}

  /**
   * Add a new day to a workout plan
   */
  async addWorkoutDay(
    userId: string,
    planId: string,
    dayDto: AddWorkoutDayDto,
  ): Promise<WorkoutDay> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    const day = this.workoutDayRepository.create({
      name: dayDto.name,
      description: dayDto.description,
      dayOrder: dayDto.dayOrder,
      plan,
    });

    return this.workoutDayRepository.save(day);
  }

  /**
   * Delete a workout day from a plan
   */
  async deleteWorkoutDay(
    userId: string,
    planId: string,
    dayId: string,
  ): Promise<void> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    const day = await this.workoutDayRepository.findOne({
      where: { id: dayId, plan: { id: planId } },
    });

    if (!day) {
      throw new NotFoundException(
        `Workout day with ID ${dayId} not found in plan ${planId}`,
      );
    }

    await this.workoutDayRepository.remove(day);
  }

  /**
   * Get a specific workout day by ID
   */
  async getWorkoutDayById(
    userId: string,
    planId: string,
    dayId: string,
  ): Promise<WorkoutDay> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    const day = await this.workoutDayRepository.findOne({
      where: { id: dayId, plan: { id: planId } },
      relations: ['exercises', 'exercises.exercise', 'exercises.sets'],
      order: {
        exercises: {
          exerciseOrder: 'ASC',
          sets: {
            setOrder: 'ASC',
          },
        },
      },
    });

    if (!day) {
      throw new NotFoundException(
        `Workout day with ID ${dayId} not found in plan ${planId}`,
      );
    }

    return day;
  }
}
