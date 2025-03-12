import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutController } from './workout.controller';
import { WorkoutService } from './workout.service';
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
  providers: [WorkoutService],
  exports: [WorkoutService],
})
export class WorkoutModule {}
