import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkoutsService } from './workouts.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateExerciseSetDto } from './dto/create-exercise-set.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Workouts')
@ApiBearerAuth('JWT-auth')
@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post('routines')
  @ApiOperation({ summary: 'Create a new workout routine' })
  @ApiResponse({
    status: 201,
    description: 'Workout routine created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createRoutine(
    @GetUser() user: User,
    @Body() createRoutineDto: CreateRoutineDto,
  ) {
    return await this.workoutsService.createRoutine(user, createRoutineDto);
  }

  @Get('routines')
  @ApiOperation({
    summary: 'Get all workout routines for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Returns list of workout routines' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserRoutines(@GetUser() user: User) {
    return await this.workoutsService.getUserRoutines(user);
  }

  @Get('routines/:id')
  @ApiOperation({ summary: 'Get a specific workout routine by ID' })
  @ApiResponse({ status: 200, description: 'Returns the workout routine' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to this routine',
  })
  @ApiResponse({ status: 404, description: 'Workout routine not found' })
  async getRoutine(@GetUser() user: User, @Param('id') id: string) {
    return await this.workoutsService.getRoutine(id, user);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new workout session' })
  @ApiResponse({
    status: 201,
    description: 'Workout session created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workout routine not found' })
  async createSession(
    @GetUser() user: User,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return await this.workoutsService.createSession(user, createSessionDto);
  }

  @Post('sessions/:sessionId/exercises/:exerciseId/sets')
  @ApiOperation({ summary: 'Add an exercise set to a workout session' })
  @ApiResponse({ status: 201, description: 'Exercise set added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session or exercise not found' })
  async addSetToSession(
    @Param('sessionId') sessionId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() createSetDto: CreateExerciseSetDto,
  ) {
    return await this.workoutsService.addSetToSession(
      sessionId,
      exerciseId,
      createSetDto,
    );
  }

  @Put('sessions/:id/complete')
  @ApiOperation({ summary: 'Mark a workout session as complete' })
  @ApiResponse({
    status: 200,
    description: 'Workout session marked as complete',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workout session not found' })
  async completeSession(@GetUser() user: User, @Param('id') id: string) {
    return await this.workoutsService.completeSession(id, user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get workout history for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns workout history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWorkoutHistory(@GetUser() user: User) {
    return await this.workoutsService.getUserWorkoutHistory(user);
  }
}
