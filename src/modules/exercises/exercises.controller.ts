import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';

@ApiTags('Exercises')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('targetList')
  @ApiOperation({
    summary: 'Get target muscle groups list',
    description:
      'Retrieves a list of all available target muscle groups for exercises',
  })
  @ApiResponse({ status: 200, description: 'List of target muscle groups' })
  async getTargetList() {
    return await this.exercisesService.getTargetList();
  }

  @Get('equipmentList')
  @ApiOperation({
    summary: 'Get equipment list',
    description: 'Retrieves a list of all available exercise equipment',
  })
  @ApiResponse({ status: 200, description: 'List of exercise equipment' })
  async getEquipmentList() {
    return await this.exercisesService.getEquipmentList();
  }

  @Get('equipment/:equipment')
  @ApiOperation({
    summary: 'Get exercises by equipment',
    description: 'Retrieves all exercises that use specific equipment',
  })
  @ApiParam({
    name: 'equipment',
    description: 'The type of equipment to filter exercises by',
    example: 'dumbbell',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exercises for the specified equipment',
  })
  @ApiResponse({ status: 404, description: 'Equipment type not found' })
  async getExercisesByEquipment(@Param('equipment') equipment: string) {
    return await this.exercisesService.getExercisesByEquipment(equipment);
  }

  @Get('exercise/:id')
  @ApiOperation({
    summary: 'Get exercise by ID',
    description: 'Retrieves detailed information about a specific exercise',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the exercise',
    example: '12345',
  })
  @ApiResponse({ status: 200, description: 'Exercise details' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async getExerciseById(@Param('id') id: string) {
    return await this.exercisesService.getExerciseById(id);
  }

  @Get('name/:name')
  @ApiOperation({
    summary: 'Search exercises by name',
    description: 'Searches for exercises containing the specified name',
  })
  @ApiParam({
    name: 'name',
    description: 'The name to search for in exercises',
    example: 'bench press',
  })
  @ApiResponse({ status: 200, description: 'List of matching exercises' })
  async getExercisesByName(@Param('name') name: string) {
    return await this.exercisesService.getExercisesByName(name);
  }

  @Get('bodyPart/:bodyPart')
  @ApiOperation({
    summary: 'Get exercises by body part',
    description: 'Retrieves all exercises that target a specific body part',
  })
  @ApiParam({
    name: 'bodyPart',
    description: 'The body part to filter exercises by',
    example: 'chest',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exercises for the specified body part',
  })
  @ApiResponse({ status: 404, description: 'Body part not found' })
  async getExercisesByBodyPart(@Param('bodyPart') bodyPart: string) {
    return await this.exercisesService.getExercisesByBodyPart(bodyPart);
  }

  @Get('target/:target')
  @ApiOperation({
    summary: 'Get exercises by target muscle',
    description: 'Retrieves all exercises that target a specific muscle group',
  })
  @ApiParam({
    name: 'target',
    description: 'The target muscle group to filter exercises by',
    example: 'biceps',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exercises for the specified target muscle',
  })
  @ApiResponse({ status: 404, description: 'Target muscle not found' })
  async getExercisesByTarget(@Param('target') target: string) {
    return await this.exercisesService.getExercisesByTarget(target);
  }

  @Get('bodyPartList')
  @ApiOperation({
    summary: 'Get body parts list',
    description: 'Retrieves a list of all available body parts for exercises',
  })
  @ApiResponse({ status: 200, description: 'List of body parts' })
  async getBodyPartList() {
    return await this.exercisesService.getBodyPartList();
  }

  @Get()
  @ApiOperation({
    summary: 'Get all exercises',
    description: 'Retrieves a complete list of all available exercises',
  })
  @ApiResponse({ status: 200, description: 'List of all exercises' })
  async getAllExercises() {
    return await this.exercisesService.getAllExercises();
  }
}
