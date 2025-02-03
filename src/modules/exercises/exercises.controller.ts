import { Controller, Get, Param } from '@nestjs/common';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('targetList')
  async getTargetList() {
    return await this.exercisesService.getTargetList();
  }

  @Get('equipmentList')
  async getEquipmentList() {
    return await this.exercisesService.getEquipmentList();
  }

  @Get('equipment/:equipment')
  async getExercisesByEquipment(@Param('equipment') equipment: string) {
    return await this.exercisesService.getExercisesByEquipment(equipment);
  }

  @Get('exercise/:id')
  async getExerciseById(@Param('id') id: string) {
    return await this.exercisesService.getExerciseById(id);
  }

  @Get('name/:name')
  async getExercisesByName(@Param('name') name: string) {
    return await this.exercisesService.getExercisesByName(name);
  }

  @Get('bodyPart/:bodyPart')
  async getExercisesByBodyPart(@Param('bodyPart') bodyPart: string) {
    return await this.exercisesService.getExercisesByBodyPart(bodyPart);
  }

  @Get('target/:target')
  async getExercisesByTarget(@Param('target') target: string) {
    return await this.exercisesService.getExercisesByTarget(target);
  }

  @Get('bodyPartList')
  async getBodyPartList() {
    return await this.exercisesService.getBodyPartList();
  }

  @Get()
  async getAllExercises() {
    return await this.exercisesService.getAllExercises();
  }
}
