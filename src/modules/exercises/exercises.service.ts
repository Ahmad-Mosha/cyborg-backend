import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import axios from 'axios';
import { CreateCustomExerciseDto } from './dto/create-custom-exercise.dto';
import { UserExercise } from './entities/user-exercise.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ExercisesService {
  private readonly apiKey =
    'f138b53b64msh05dc01aa5c4486ep1a1c64jsn414a6d9133d2';
  private readonly baseUrl = 'https://exercisedb.p.rapidapi.com';

  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    @InjectRepository(UserExercise)
    private readonly userExerciseRepository: Repository<UserExercise>,
  ) {}

  private async callExerciseApi(
    endpoint: string,
    params: Record<string, any> = {},
  ) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
        },
        params: params,
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch data from ExerciseDB API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTargetList() {
    return this.callExerciseApi('/exercises/targetList');
  }

  async getEquipmentList() {
    return this.callExerciseApi('/exercises/equipmentList');
  }

  async getExercisesByEquipment(equipment: string) {
    return this.callExerciseApi(`/exercises/equipment/${equipment}`);
  }

  async getExerciseById(id: string) {
    return this.callExerciseApi(`/exercises/exercise/${id}`);
  }

  async getExercisesByName(name: string) {
    return this.callExerciseApi(`/exercises/name/${name}`);
  }

  async getExercisesByBodyPart(bodyPart: string) {
    return this.callExerciseApi(`/exercises/bodyPart/${bodyPart}`);
  }

  async getExercisesByTarget(target: string) {
    return this.callExerciseApi(`/exercises/target/${target}`);
  }

  async getBodyPartList() {
    return this.callExerciseApi('/exercises/bodyPartList');
  }

  async getAllExercises(limit?: number) {
    // If no limit is provided, default to 10
    // If you want all exercises, pass limit explicitly as a higher number (e.g., 1500)
    const requestLimit = limit || 10;
    return this.callExerciseApi('/exercises', { limit: requestLimit });
  }

  async saveExercise(exerciseData: Partial<Exercise>): Promise<Exercise> {
    const exercise = this.exerciseRepository.create(exerciseData);
    return await this.exerciseRepository.save(exercise);
  }

  async syncExercisesWithDatabase() {
    try {
      // Get all exercises by setting a high limit
      const exercises = await this.callExerciseApi('/exercises', {
        limit: 1500,
      });

      // Process and save each exercise
      for (const exerciseData of exercises) {
        // Check if exercise already exists
        const existingExercise = await this.exerciseRepository.findOne({
          where: { name: exerciseData.name },
        });

        if (!existingExercise) {
          await this.saveExercise({
            name: exerciseData.name,
            bodyPart: exerciseData.bodyPart,
            equipment: exerciseData.equipment,
            gifUrl: exerciseData.gifUrl,
            target: exerciseData.target,
            secondaryMuscles: exerciseData.secondaryMuscles,
            instructions: exerciseData.instructions,
          });
        }
      }

      return { message: `Successfully synced ${exercises.length} exercises` };
    } catch (error) {
      throw new HttpException(
        'Failed to sync exercises with database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllExercisesFromDb(page: number = 1, limit: number = 10) {
    try {
      const [exercises, total] = await this.exerciseRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: exercises,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch exercises from database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createCustomExercise(
    dto: CreateCustomExerciseDto,
    user: User,
  ): Promise<Exercise> {
    const exerciseData = {
      ...dto,
      isCustom: true,
    };

    const exercise = await this.exerciseRepository.save(exerciseData);

    const userExerciseData = {
      exercise: { id: exercise.id },
      user: { id: user.id },
      isCustom: true,
    };

    await this.userExerciseRepository.save(userExerciseData);

    return exercise;
  }

  async toggleFavorite(exerciseId: string, user: User): Promise<UserExercise> {
    let userExercise = await this.userExerciseRepository.findOne({
      where: {
        exercise: { id: exerciseId },
        user: { id: user.id },
      },
      relations: ['exercise', 'user'],
    });

    if (!userExercise) {
      const exercise = await this.exerciseRepository.findOneBy({
        id: exerciseId,
      });
      if (!exercise) {
        throw new HttpException('Exercise not found', HttpStatus.NOT_FOUND);
      }

      const userExerciseData = {
        exercise: { id: exercise.id },
        user: { id: user.id },
        isFavorite: true,
      };

      userExercise = await this.userExerciseRepository.save(userExerciseData);
    } else {
      userExercise.isFavorite = !userExercise.isFavorite;
      userExercise = await this.userExerciseRepository.save(userExercise);
    }

    return userExercise;
  }

  async getFavoriteExercises(user: User): Promise<Exercise[]> {
    const userExercises = await this.userExerciseRepository.find({
      where: {
        user: { id: user.id },
        isFavorite: true,
      },
      relations: ['exercise'],
    });

    return userExercises.map((ue) => ue.exercise);
  }

  async getCustomExercises(user: User): Promise<Exercise[]> {
    const userExercises = await this.userExerciseRepository.find({
      where: {
        user: { id: user.id },
        isCustom: true,
      },
      relations: ['exercise'],
    });

    return userExercises.map((ue) => ue.exercise);
  }
}
