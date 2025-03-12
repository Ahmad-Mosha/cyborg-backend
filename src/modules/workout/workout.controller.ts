import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { StartWorkoutSessionDto } from './dto/start-workout-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateCompletedSetDto } from './dto/update-completed-set.dto';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { WorkoutSession } from './entities/workout-session.entity';
import { CompletedSet } from './entities/completed-set.entity';
import { AddWorkoutDayDto } from './dto/add-workout-day.dto';
import { AddWorkoutExerciseDto } from './dto/add-workout-exercise.dto';
import { AddExerciseSetDto } from './dto/add-exercise-set.dto';
import { WorkoutDay } from './entities/workout-day.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { ExerciseSet } from './entities/exercise-set.entity';
import { WorkoutSessionResponseDto } from './dto/workout-session.response.dto';

// Sample request and response examples
const createWorkoutPlanExample = {
  name: '4-Day Split',
  description: 'My custom workout plan focusing on strength gains',
  type: 'custom',
  days: [
    {
      name: 'Chest and Triceps',
      description: 'Push day focusing on chest and triceps',
      dayOrder: 1,
      exercises: [
        {
          exerciseId: '0001',
          exerciseOrder: 1,
          notes: 'Warm up with light weight first',
          sets: [
            {
              setOrder: 1,
              reps: 12,
              weight: 50,
              notes: 'Warm-up set',
            },
            {
              setOrder: 2,
              reps: 10,
              weight: 60,
            },
          ],
        },
      ],
    },
  ],
};

const startWorkoutSessionExample = {
  planId: 'workout-plan-uuid',
  dayId: 'workout-day-uuid',
  name: 'Monday Push Session',
  notes: 'Feeling good today!',
};

const workoutSessionResponseExample = {
  id: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  name: 'Monday Push Session',
  notes: 'Feeling good today!',
  startTime: '3/8/2025, 2:30:00 PM',
  endTime: '3/8/2025, 3:45:00 PM',
  isCompleted: true,
  durationMinutes: 75,
  exercises: [
    {
      id: 'uuid-string',
      exerciseOrder: 1,
      exercise: {
        id: '0001',
        name: 'Bench Press',
      },
      sets: [
        {
          id: 'uuid-string',
          setOrder: 1,
          reps: 12,
          weight: 50,
        },
      ],
    },
  ],
};

const updateCompletedSetExample = {
  reps: 10,
  weight: 75,
  notes: 'Felt stronger than expected',
};

const addWorkoutDayExample = {
  name: 'Leg Day',
  description: 'Focus on quadriceps, hamstrings and calves',
  dayOrder: 3,
};

const addWorkoutExerciseExample = {
  exerciseId: '0005',
  exerciseOrder: 2,
  notes: 'Focus on full range of motion',
};

const addExerciseSetExample = {
  setOrder: 3,
  reps: 8,
  weight: 80,
  notes: 'Heavy set, spotter recommended',
};

@ApiTags('workout')
@ApiBearerAuth()
@Controller('workout')
@UseGuards(JwtAuthGuard)
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  // Workout Plan Endpoints
  @Post('plans')
  @ApiOperation({ summary: 'Create a new workout plan' })
  @ApiResponse({
    status: 201,
    description: 'The workout plan has been created successfully.',
    type: WorkoutPlan,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBody({
    type: CreateWorkoutPlanDto,
    examples: {
      example1: {
        summary: 'Create a 4-day split workout plan',
        description: 'Sample workout plan with multiple days and exercises',
        value: createWorkoutPlanExample,
      },
    },
  })
  createWorkoutPlan(
    @Req() req: RequestWithUser,
    @Body() createPlanDto: CreateWorkoutPlanDto,
  ) {
    return this.workoutService.createWorkoutPlan(req.user.id, createPlanDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all workout plans for the user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all workout plans.',
    type: [WorkoutPlan],
  })
  getUserWorkoutPlans(@Req() req: RequestWithUser) {
    return this.workoutService.getUserWorkoutPlans(req.user.id);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a specific workout plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the workout plan.',
    type: WorkoutPlan,
  })
  @ApiResponse({ status: 404, description: 'Workout plan not found' })
  @ApiParam({
    name: 'id',
    description: 'Workout plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  getWorkoutPlanById(@Req() req: RequestWithUser, @Param('id') planId: string) {
    return this.workoutService.getWorkoutPlanById(req.user.id, planId);
  }

  @Post('generate-plan')
  @ApiOperation({ summary: 'Generate an AI workout plan based on user data' })
  @ApiResponse({
    status: 201,
    description: 'The AI workout plan has been generated.',
    type: WorkoutPlan,
  })
  generateAIWorkoutPlan(@Req() req: RequestWithUser) {
    return this.workoutService.generateAIWorkoutPlan(
      req.user.id,
      req.user.health,
    );
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workout plan' })
  @ApiResponse({
    status: 204,
    description: 'The workout plan has been deleted.',
  })
  @ApiResponse({ status: 404, description: 'Workout plan not found' })
  @ApiParam({
    name: 'id',
    description: 'Workout plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  async deleteWorkoutPlan(
    @Req() req: RequestWithUser,
    @Param('id') planId: string,
  ) {
    await this.workoutService.deleteWorkoutPlan(req.user.id, planId);
  }

  // Workout Day Endpoints
  @Post('plans/:planId/days')
  @ApiOperation({ summary: 'Add a new day to a workout plan' })
  @ApiResponse({
    status: 201,
    description: 'The workout day has been created.',
    type: WorkoutDay,
  })
  @ApiResponse({ status: 404, description: 'Workout plan not found' })
  @ApiParam({
    name: 'planId',
    description: 'Workout plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: AddWorkoutDayDto,
    examples: {
      example1: {
        summary: 'Add leg day to workout plan',
        description: 'Add a new leg day to an existing workout plan',
        value: addWorkoutDayExample,
      },
    },
  })
  addWorkoutDay(
    @Req() req: RequestWithUser,
    @Param('planId') planId: string,
    @Body() addDayDto: AddWorkoutDayDto,
  ) {
    return this.workoutService.addWorkoutDay(req.user.id, planId, addDayDto);
  }

  @Delete('plans/:planId/days/:dayId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a day from a workout plan' })
  @ApiResponse({
    status: 204,
    description: 'The workout day has been deleted.',
  })
  @ApiResponse({ status: 404, description: 'Workout plan or day not found' })
  @ApiParam({
    name: 'planId',
    description: 'Workout plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiParam({
    name: 'dayId',
    description: 'Workout day ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  async deleteWorkoutDay(
    @Req() req: RequestWithUser,
    @Param('planId') planId: string,
    @Param('dayId') dayId: string,
  ) {
    await this.workoutService.deleteWorkoutDay(req.user.id, planId, dayId);
  }

  // Workout Exercise Endpoints
  @Post('plans/:planId/days/:dayId/exercises')
  @ApiOperation({ summary: 'Add a new exercise to a workout day' })
  @ApiResponse({
    status: 201,
    description: 'The exercise has been added.',
    type: WorkoutExercise,
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan, day, or exercise not found',
  })
  @ApiParam({
    name: 'planId',
    description: 'Workout plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiParam({
    name: 'dayId',
    description: 'Workout day ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  @ApiBody({
    type: AddWorkoutExerciseDto,
    examples: {
      example1: {
        summary: 'Add an exercise to a workout day',
        description: 'Add a new exercise to an existing workout day',
        value: addWorkoutExerciseExample,
      },
    },
  })
  addWorkoutExercise(
    @Req() req: RequestWithUser,
    @Param('planId') planId: string,
    @Param('dayId') dayId: string,
    @Body() addExerciseDto: AddWorkoutExerciseDto,
  ) {
    return this.workoutService.addWorkoutExercise(
      req.user.id,
      planId,
      dayId,
      addExerciseDto,
    );
  }

  @Delete('plans/:planId/days/:dayId/exercises/:exerciseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an exercise from a workout day' })
  @ApiResponse({
    status: 204,
    description: 'The exercise has been deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan, day, or exercise not found',
  })
  @ApiParam({
    name: 'planId',
    description: 'Workout plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiParam({
    name: 'dayId',
    description: 'Workout day ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  @ApiParam({
    name: 'exerciseId',
    description: 'Workout exercise ID',
    example: 'c3d4e5f6-g7h8-9012-cdef-gh3456789012',
  })
  async deleteWorkoutExercise(
    @Req() req: RequestWithUser,
    @Param('planId') planId: string,
    @Param('dayId') dayId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    await this.workoutService.deleteWorkoutExercise(
      req.user.id,
      planId,
      dayId,
      exerciseId,
    );
  }

  // Exercise Set Endpoints
  @Post('plans/:planId/days/:dayId/exercises/:exerciseId/sets')
  @ApiOperation({ summary: 'Add a new set to an exercise' })
  @ApiResponse({
    status: 201,
    description: 'The set has been added.',
    type: ExerciseSet,
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan, day, or exercise not found',
  })
  @ApiParam({
    name: 'planId',
    description: 'Workout plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiParam({
    name: 'dayId',
    description: 'Workout day ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  @ApiParam({
    name: 'exerciseId',
    description: 'Workout exercise ID',
    example: 'c3d4e5f6-g7h8-9012-cdef-gh3456789012',
  })
  @ApiBody({
    type: AddExerciseSetDto,
    examples: {
      example1: {
        summary: 'Add a set to an exercise',
        description: 'Add a new set to an existing exercise',
        value: addExerciseSetExample,
      },
    },
  })
  addExerciseSet(
    @Req() req: RequestWithUser,
    @Param('planId') planId: string,
    @Param('dayId') dayId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() addSetDto: AddExerciseSetDto,
  ) {
    return this.workoutService.addExerciseSet(
      req.user.id,
      planId,
      dayId,
      exerciseId,
      addSetDto,
    );
  }

  @Delete('plans/:planId/days/:dayId/exercises/:exerciseId/sets/:setId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a set from an exercise' })
  @ApiResponse({
    status: 204,
    description: 'The set has been deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan, day, exercise, or set not found',
  })
  @ApiParam({
    name: 'planId',
    description: 'Workout plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiParam({
    name: 'dayId',
    description: 'Workout day ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  @ApiParam({
    name: 'exerciseId',
    description: 'Workout exercise ID',
    example: 'c3d4e5f6-g7h8-9012-cdef-gh3456789012',
  })
  @ApiParam({
    name: 'setId',
    description: 'Exercise set ID',
    example: 'd4e5f6g7-h8i9-0123-defg-hi4567890123',
  })
  async deleteExerciseSet(
    @Req() req: RequestWithUser,
    @Param('planId') planId: string,
    @Param('dayId') dayId: string,
    @Param('exerciseId') exerciseId: string,
    @Param('setId') setId: string,
  ) {
    await this.workoutService.deleteExerciseSet(
      req.user.id,
      planId,
      dayId,
      exerciseId,
      setId,
    );
  }

  // Workout Session Endpoints
  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a new workout session' })
  @ApiResponse({
    status: 201,
    description: 'The workout session has been started.',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'User already has an active session',
  })
  @ApiBody({
    type: StartWorkoutSessionDto,
    examples: {
      example1: {
        summary: 'Start a workout session from a plan',
        description: 'Start a session using an existing workout plan and day',
        value: startWorkoutSessionExample,
      },
    },
  })
  startWorkoutSession(
    @Req() req: RequestWithUser,
    @Body() startDto: StartWorkoutSessionDto,
  ) {
    return this.workoutService.startWorkoutSession(req.user.id, startDto);
  }

  @Put('sessions/:id/complete')
  @ApiOperation({ summary: 'Complete an active workout session' })
  @ApiResponse({
    status: 200,
    description: 'The workout session has been completed.',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Workout session not found' })
  @ApiParam({
    name: 'id',
    description: 'Workout session ID',
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  completeWorkoutSession(
    @Req() req: RequestWithUser,
    @Param('id') sessionId: string,
  ) {
    return this.workoutService.completeWorkoutSession(req.user.id, sessionId);
  }

  @Get('sessions/active')
  @ApiOperation({ summary: 'Get the active workout session' })
  @ApiResponse({
    status: 200,
    description: 'Returns the active session or null.',
    type: WorkoutSessionResponseDto,
  })
  getActiveWorkoutSession(@Req() req: RequestWithUser) {
    return this.workoutService.getActiveWorkoutSession(req.user.id);
  }

  @Get('sessions/history')
  @ApiOperation({ summary: 'Get workout session history' })
  @ApiResponse({
    status: 200,
    description: 'Returns all completed sessions.',
    type: [WorkoutSessionResponseDto],
  })
  getUserWorkoutHistory(@Req() req: RequestWithUser) {
    return this.workoutService.getUserWorkoutHistory(req.user.id);
  }

  // Set Update Endpoint
  @Put('sets/:id')
  @ApiOperation({ summary: 'Update a set in an active workout' })
  @ApiResponse({
    status: 200,
    description: 'The set has been updated.',
    type: CompletedSet,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update sets in a completed workout session',
  })
  @ApiResponse({ status: 404, description: 'Set not found' })
  @ApiParam({
    name: 'id',
    description: 'Set ID',
    example: 'c3d4e5f6-g7h8-9012-cdef-gh3456789012',
  })
  @ApiBody({
    type: UpdateCompletedSetDto,
    examples: {
      example1: {
        summary: 'Update set with new values',
        description: 'Update reps, weight, and notes for a set',
        value: updateCompletedSetExample,
      },
    },
  })
  updateCompletedSet(
    @Req() req: RequestWithUser,
    @Param('id') setId: string,
    @Body() updateDto: UpdateCompletedSetDto,
  ) {
    return this.workoutService.updateCompletedSet(
      req.user.id,
      setId,
      updateDto,
    );
  }

  // Analytics Endpoints
  @Get('analytics')
  @ApiOperation({ summary: 'Get workout analytics' })
  @ApiResponse({
    status: 200,
    description: 'Returns workout analytics data.',
    schema: {
      example: {
        totalWorkouts: 45,
        workoutsToday: 1,
        workoutsYesterday: 1,
        workoutsThisWeek: 3,
        workoutsThisMonth: 12,
        mostFrequentExercises: [
          { exerciseName: 'Bench Press', count: 15 },
          { exerciseName: 'Squat', count: 12 },
        ],
        volumeByBodyPart: [
          { bodyPart: 'chest', totalVolume: 12500 },
          { bodyPart: 'upper legs', totalVolume: 10800 },
        ],
      },
    },
  })
  getWorkoutAnalytics(@Req() req: RequestWithUser) {
    return this.workoutService.getWorkoutAnalytics(req.user.id);
  }

  @Get('exercises/:id/history')
  @ApiOperation({ summary: 'Get exercise history' })
  @ApiResponse({
    status: 200,
    description: 'Returns the history for a specific exercise.',
    schema: {
      example: [
        {
          date: '2023-08-10T14:00:00.000Z',
          sets: [
            { reps: 12, weight: 50 },
            { reps: 10, weight: 60 },
          ],
        },
        {
          date: '2023-08-03T15:00:00.000Z',
          sets: [
            { reps: 12, weight: 45 },
            { reps: 10, weight: 55 },
          ],
        },
      ],
    },
  })
  @ApiParam({
    name: 'id',
    description: 'Exercise ID',
    example: 'd4e5f6g7-h8i9-0123-defg-hi4567890123',
  })
  getExerciseHistory(
    @Req() req: RequestWithUser,
    @Param('id') exerciseId: string,
  ) {
    return this.workoutService.getExerciseHistory(req.user.id, exerciseId);
  }
}
