import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { WorkoutRoutine } from './entities/workout-routine.entity';
import { WorkoutSession } from './entities/workout-session.entity';
import { Exercise } from './entities/exercise.entity';
import { ExerciseSet } from './entities/exercise-set.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutRoutine,
      WorkoutSession,
      Exercise,
      ExerciseSet,
    ]),
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
