import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkoutsService } from './workouts.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateExerciseSetDto } from './dto/create-exercise-set.dto';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  // Workout Routine Endpoints
  @Post('routines')
  async createRoutine(
    @Request() req,
    @Body() createRoutineDto: CreateRoutineDto,
  ) {
    return await this.workoutsService.createRoutine(req.user, createRoutineDto);
  }

  @Get('routines')
  async getUserRoutines(@Request() req) {
    return await this.workoutsService.getUserRoutines(req.user);
  }

  @Get('routines/:id')
  async getRoutine(@Request() req, @Param('id') id: string) {
    return await this.workoutsService.getRoutine(id, req.user);
  }

  // Workout Session Endpoints
  @Post('sessions')
  async createSession(
    @Request() req,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return await this.workoutsService.createSession(req.user, createSessionDto);
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
  async completeSession(@Request() req, @Param('id') id: string) {
    return await this.workoutsService.completeSession(id, req.user);
  }

  @Get('history')
  async getWorkoutHistory(@Request() req) {
    return await this.workoutsService.getUserWorkoutHistory(req.user);
  }
}
