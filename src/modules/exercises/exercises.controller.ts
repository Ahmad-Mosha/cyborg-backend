import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UseGuards,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateCustomExerciseDto } from './dto/create-custom-exercise.dto';

@ApiTags('Exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post('sync')
  @ApiOperation({
    summary: 'Sync exercises with database',
    description:
      'Fetches all exercises from ExerciseDB API and stores them in the database',
  })
  @ApiResponse({ status: 200, description: 'Exercises synced successfully' })
  async syncExercises() {
    return await this.exercisesService.syncExercisesWithDatabase();
  }

  @Get('db')
  @ApiOperation({
    summary: 'Get all exercises from database',
    description: 'Retrieves paginated exercises from the local database',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of exercises with pagination',
  })
  async getAllExercisesFromDb(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.exercisesService.getAllExercisesFromDb(page, limit);
  }

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
    summary: 'Get exercises from ExerciseDB API',
    description:
      'Retrieves exercises from ExerciseDB API with pagination support',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of exercises to return (default: 10)',
  })
  @ApiResponse({ status: 200, description: 'List of exercises' })
  async getAllExercises(@Query('limit') limit?: number) {
    return await this.exercisesService.getAllExercises(limit);
  }

  @Post('custom')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a custom exercise' })
  @ApiResponse({ status: 201, description: 'Custom exercise created' })
  async createCustomExercise(
    @Body() createExerciseDto: CreateCustomExerciseDto,
    @GetUser() user: User,
  ) {
    return await this.exercisesService.createCustomExercise(
      createExerciseDto,
      user,
    );
  }

  @Post('favorite/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle favorite status of an exercise' })
  @ApiResponse({ status: 200, description: 'Favorite status toggled' })
  async toggleFavorite(@Param('id') id: string, @GetUser() user: User) {
    return await this.exercisesService.toggleFavorite(id, user);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user's favorite exercises" })
  @ApiResponse({ status: 200, description: 'List of favorite exercises' })
  async getFavoriteExercises(@GetUser() user: User) {
    return await this.exercisesService.getFavoriteExercises(user);
  }

  @Get('custom')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user's custom exercises" })
  @ApiResponse({ status: 200, description: 'List of custom exercises' })
  async getCustomExercises(@GetUser() user: User) {
    return await this.exercisesService.getCustomExercises(user);
  }

  @Get('gif/:id')
  @ApiOperation({
    summary: 'Get exercise GIF URL by ID',
    description:
      'Redirects to the current GIF URL for an exercise, handling URL changes over time',
  })
  @ApiParam({
    name: 'id',
    description: 'The exercise ID',
    example: '0001',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to the current GIF URL',
  })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async getExerciseGif(@Param('id') id: string, @Res() res) {
    try {
      const exercise = await this.exercisesService.getExerciseById(id);

      if (!exercise || !exercise.gifUrl) {
        throw new NotFoundException(
          `Exercise with ID ${id} not found or has no GIF`,
        );
      }

      return res.redirect(exercise.gifUrl);
    } catch (error) {
      throw new NotFoundException(`Exercise GIF not found: ${error.message}`);
    }
  }
}
