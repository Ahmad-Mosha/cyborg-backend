import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutController } from './workout.controller';
import { WorkoutPlan } from './entities/workout-plan.entity';
import { WorkoutDay } from './entities/workout-day.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { ExerciseSet } from './entities/exercise-set.entity';
import { WorkoutSession } from './entities/workout-session.entity';
import { CompletedExercise } from './entities/completed-exercise.entity';
import { CompletedSet } from './entities/completed-set.entity';
import { Exercise } from '../exercises/entities/exercise.entity';
import { ExercisesModule } from '../exercises/exercises.module';
import { ChatModule } from '../chat/chat.module';

// Import new services
import { PlanService } from './services/plan.service';
import { DayService } from './services/day.service';
import { ExerciseService } from './services/exercise.service';
import { SessionService } from './services/session.service';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutPlan,
      WorkoutDay,
      WorkoutExercise,
      ExerciseSet,
      WorkoutSession,
      CompletedExercise,
      CompletedSet,
      Exercise,
    ]),
    ExercisesModule,
    ChatModule,
  ],
  controllers: [WorkoutController],
  providers: [
    PlanService,
    DayService,
    ExerciseService,
    SessionService,
    AnalyticsService,
  ],
  exports: [
    PlanService,
    DayService,
    ExerciseService,
    SessionService,
    AnalyticsService,
  ],
})
export class WorkoutModule {}
