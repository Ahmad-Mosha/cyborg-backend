import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import axios from 'axios';

@Injectable()
export class ExercisesService {
  private readonly apiKey =
    'f138b53b64msh05dc01aa5c4486ep1a1c64jsn414a6d9133d2';
  private readonly baseUrl = 'https://exercisedb.p.rapidapi.com';

  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
  ) {}

  private async callExerciseApi(endpoint: string) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
        },
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

  async getAllExercises() {
    return this.callExerciseApi('/exercises');
  }

  async saveExercise(exerciseData: Partial<Exercise>): Promise<Exercise> {
    const exercise = this.exerciseRepository.create(exerciseData);
    return await this.exerciseRepository.save(exercise);
  }
}
