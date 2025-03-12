import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
import { WorkoutPlan, PlanType } from './entities/workout-plan.entity';
import { WorkoutDay } from './entities/workout-day.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { ExerciseSet, SetType } from './entities/exercise-set.entity';
import { WorkoutSession } from './entities/workout-session.entity';
import { CompletedExercise } from './entities/completed-exercise.entity';
import { CompletedSet } from './entities/completed-set.entity';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { StartWorkoutSessionDto } from './dto/start-workout-session.dto';
import { UpdateCompletedSetDto } from './dto/update-completed-set.dto';
import { AddWorkoutDayDto } from './dto/add-workout-day.dto';
import { AddWorkoutExerciseDto } from './dto/add-workout-exercise.dto';
import { AddExerciseSetDto } from './dto/add-exercise-set.dto';
import { WorkoutSessionResponseDto } from './dto/workout-session.response.dto';

// Import the new services
import { PlanService } from './services/plan.service';
import { DayService } from './services/day.service';
import { ExerciseService } from './services/exercise.service';
import { SessionService } from './services/session.service';
import { AnalyticsService } from './services/analytics.service';

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

@ApiTags('Workouts')
@ApiBearerAuth()
@Controller('workout')
@UseGuards(JwtAuthGuard)
export class WorkoutController {
  constructor(
    private readonly planService: PlanService,
    private readonly dayService: DayService,
    private readonly exerciseService: ExerciseService,
    private readonly sessionService: SessionService,
    private readonly analyticsService: AnalyticsService,
  ) {}

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
    return this.planService.createWorkoutPlan(req.user.id, createPlanDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all workout plans for the user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all workout plans.',
    type: [WorkoutPlan],
  })
  getUserWorkoutPlans(@Req() req: RequestWithUser) {
    return this.planService.getUserWorkoutPlans(req.user.id);
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
    return this.planService.getWorkoutPlanById(req.user.id, planId);
  }

  @Post('generate-plan')
  @ApiOperation({ summary: 'Generate an AI workout plan based on user data' })
  @ApiResponse({
    status: 201,
    description: 'The AI workout plan has been generated.',
    type: WorkoutPlan,
  })
  generateAIWorkoutPlan(@Req() req: RequestWithUser) {
    return this.planService.generateAIWorkoutPlan(req.user.id, req.user.health);
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
    await this.planService.deleteWorkoutPlan(req.user.id, planId);
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
    return this.dayService.addWorkoutDay(req.user.id, planId, addDayDto);
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
    await this.dayService.deleteWorkoutDay(req.user.id, planId, dayId);
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
    return this.exerciseService.addWorkoutExercise(
      req.user.id,
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
    await this.exerciseService.deleteWorkoutExercise(req.user.id, exerciseId);
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
    return this.exerciseService.addExerciseSets(
      req.user.id,
      exerciseId,
      [addSetDto], // Pass as an array of sets
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
    await this.exerciseService.deleteExerciseSet(req.user.id, setId);
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
    return this.sessionService.startWorkoutSession(
      req.user.id,
      startDto.planId,
      startDto.dayId,
    );
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
    return this.sessionService.endWorkoutSession(req.user.id, sessionId);
  }

  @Get('sessions/active')
  @ApiOperation({ summary: 'Get the active workout session' })
  @ApiResponse({
    status: 200,
    description: 'Returns the active session or null.',
    type: WorkoutSessionResponseDto,
  })
  getActiveWorkoutSession(@Req() req: RequestWithUser) {
    return this.sessionService.getActiveWorkoutSession(req.user.id);
  }

  @Get('sessions/history')
  @ApiOperation({ summary: 'Get workout session history' })
  @ApiResponse({
    status: 200,
    description: 'Returns all completed sessions.',
    type: [WorkoutSessionResponseDto],
  })
  getUserWorkoutHistory(@Req() req: RequestWithUser) {
    // Using SessionService's getUserWorkoutSessions method with default pagination
    return this.sessionService
      .getUserWorkoutSessions(req.user.id)
      .then(([sessions]) => sessions);
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
    return this.sessionService.updateCompletedSet(
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
        totalWorkoutTime: 4320,
        averageWorkoutTime: 96,
        completedExercises: 180,
        totalSets: 540,
        mostFrequentExercises: [
          { exerciseId: '1', exerciseName: 'Bench Press', count: 15 },
          { exerciseId: '2', exerciseName: 'Squat', count: 12 },
        ],
      },
    },
  })
  getWorkoutAnalytics(@Req() req: RequestWithUser) {
    return this.analyticsService.getWorkoutStats(req.user.id);
  }

  @Get('exercises/:id/history')
  @ApiOperation({ summary: 'Get exercise history' })
  @ApiResponse({
    status: 200,
    description: 'Returns the history for a specific exercise.',
    schema: {
      example: {
        exerciseId: '1',
        exerciseName: 'Bench Press',
        sessions: [
          {
            sessionId: 'a1b2c3',
            date: '2023-08-10T14:00:00.000Z',
            maxWeight: 60,
            totalReps: 32,
            totalSets: 3,
          },
          {
            sessionId: 'b2c3d4',
            date: '2023-08-03T15:00:00.000Z',
            maxWeight: 55,
            totalReps: 30,
            totalSets: 3,
          },
        ],
      },
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
    return this.analyticsService.getExerciseProgress(req.user.id, exerciseId);
  }

  @Get('analytics/total')
  @ApiOperation({ summary: 'Get total number of workouts' })
  @ApiResponse({
    status: 200,
    description: 'Returns the total number of completed workouts',
    schema: {
      example: {
        total: 45,
      },
    },
  })
  async getTotalWorkouts(@Req() req: RequestWithUser) {
    const stats = await this.analyticsService.getWorkoutStats(req.user.id);
    return { total: stats.totalWorkouts };
  }

  @Get('analytics/trends')
  @ApiOperation({ summary: 'Get workout trends over time' })
  @ApiResponse({
    status: 200,
    description: 'Returns workout trends by month',
    schema: {
      example: [
        {
          year: 2023,
          month: 8,
          workouts: 12,
          totalDuration: 1080,
          averageDuration: 90,
        },
        {
          year: 2023,
          month: 7,
          workouts: 10,
          totalDuration: 900,
          averageDuration: 90,
        },
      ],
    },
  })
  async getWorkoutTrends(@Req() req: RequestWithUser) {
    return this.analyticsService.getSessionTrends(req.user.id);
  }

  @Get('analytics/personal-records')
  @ApiOperation({ summary: 'Get personal records for exercises' })
  @ApiResponse({
    status: 200,
    description: 'Returns personal records for exercises',
    schema: {
      example: [
        {
          exerciseId: '1',
          exerciseName: 'Bench Press',
          maxWeight: 100,
          date: '2023-08-10T14:00:00.000Z',
        },
        {
          exerciseId: '2',
          exerciseName: 'Squat',
          maxWeight: 150,
          date: '2023-08-03T15:00:00.000Z',
        },
      ],
    },
  })
  async getPersonalRecords(@Req() req: RequestWithUser) {
    return this.analyticsService.getPersonalRecords(req.user.id);
  }

  // Rest Timer Endpoints
  @Post('sets/:id/start-rest')
  @ApiOperation({ summary: 'Start rest timer for a set' })
  @ApiResponse({
    status: 200,
    description: 'Rest timer started successfully',
    type: CompletedSet,
  })
  @ApiResponse({ status: 404, description: 'Set not found' })
  @ApiParam({
    name: 'id',
    description: 'Set ID',
    example: 'uuid-string',
  })
  async startSetRestTimer(
    @Req() req: RequestWithUser,
    @Param('id') setId: string,
  ) {
    return this.sessionService.startSetRestTimer(req.user.id, setId);
  }

  @Get('sets/:id/rest-remaining')
  @ApiOperation({ summary: 'Get remaining rest time for a set' })
  @ApiResponse({
    status: 200,
    description: 'Returns remaining rest time in seconds',
    schema: {
      example: {
        remainingSeconds: 45,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Set not found' })
  @ApiParam({
    name: 'id',
    description: 'Set ID',
    example: 'uuid-string',
  })
  async getSetRestTimeRemaining(@Param('id') setId: string) {
    const remainingSeconds =
      await this.sessionService.getSetRestTimeRemaining(setId);
    return { remainingSeconds };
  }
}
