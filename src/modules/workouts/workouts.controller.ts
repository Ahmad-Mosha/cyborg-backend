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

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  // Workout Routine Endpoints
  @Post('routines')
  async createRoutine(
    @GetUser() user: User,
    @Body() createRoutineDto: CreateRoutineDto,
  ) {
    return await this.workoutsService.createRoutine(user, createRoutineDto);
  }

  @Get('routines')
  async getUserRoutines(@GetUser() user: User) {
    return await this.workoutsService.getUserRoutines(user);
  }

  @Get('routines/:id')
  async getRoutine(@GetUser() user: User, @Param('id') id: string) {
    return await this.workoutsService.getRoutine(id, user);
  }

  // Workout Session Endpoints
  @Post('sessions')
  async createSession(
    @GetUser() user: User,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return await this.workoutsService.createSession(user, createSessionDto);
  }

  @Post('sessions/:sessionId/exercises/:exerciseId/sets')
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
  async completeSession(@GetUser() user: User, @Param('id') id: string) {
    return await this.workoutsService.completeSession(id, user);
  }

  @Get('history')
  async getWorkoutHistory(@GetUser() user: User) {
    return await this.workoutsService.getUserWorkoutHistory(user);
  }
}
