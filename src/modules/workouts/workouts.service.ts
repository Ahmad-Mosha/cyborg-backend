// import {
//   Injectable,
//   NotFoundException,
//   ForbiddenException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { WorkoutRoutine } from './entities/workout-routine.entity';
// import { WorkoutSession } from './entities/workout-session.entity';
// import { Exercise } from './entities/exercise.entity';
// import { ExerciseSet } from './entities/exercise-set.entity';
// import { CreateRoutineDto } from './dto/create-routine.dto';
// import { CreateSessionDto } from './dto/create-session.dto';
// import { CreateExerciseSetDto } from './dto/create-exercise-set.dto';
// import { User } from '../users/entities/user.entity';

// @Injectable()
// export class WorkoutsService {
//   constructor(
//     @InjectRepository(WorkoutRoutine)
//     private routineRepository: Repository<WorkoutRoutine>,
//     @InjectRepository(WorkoutSession)
//     private sessionRepository: Repository<WorkoutSession>,
//     @InjectRepository(Exercise)
//     private exerciseRepository: Repository<Exercise>,
//     @InjectRepository(ExerciseSet)
//     private setRepository: Repository<ExerciseSet>,
//   ) {}

//   // Workout Routine Methods
//   async createRoutine(
//     user: User,
//     createRoutineDto: CreateRoutineDto,
//   ): Promise<WorkoutRoutine> {
//     const routine = this.routineRepository.create({
//       ...createRoutineDto,
//       creator: user,
//     });
//     return await this.routineRepository.save(routine);
//   }

//   async getRoutine(id: string, user: User): Promise<WorkoutRoutine> {
//     const routine = await this.routineRepository.findOne({
//       where: { id },
//       relations: ['creator', 'exercises'],
//     });

//     if (!routine) {
//       throw new NotFoundException('Workout routine not found');
//     }

//     if (!routine.isPublic && routine.creator.id !== user.id) {
//       throw new ForbiddenException('You do not have access to this routine');
//     }

//     return routine;
//   }

//   async getUserRoutines(user: User): Promise<WorkoutRoutine[]> {
//     return await this.routineRepository.find({
//       where: { creator: { id: user.id } },
//       relations: ['exercises'],
//     });
//   }

//   // Workout Session Methods
//   async createSession(
//     user: User,
//     createSessionDto: CreateSessionDto,
//   ): Promise<WorkoutSession> {
//     const routine = await this.routineRepository.findOne({
//       where: { id: createSessionDto.routineId },
//     });

//     if (!routine) {
//       throw new NotFoundException('Workout routine not found');
//     }

//     const session = this.sessionRepository.create({
//       ...createSessionDto,
//       user,
//       routine,
//     });

//     return await this.sessionRepository.save(session);
//   }

//   async addSetToSession(
//     sessionId: string,
//     exerciseId: string,
//     createSetDto: CreateExerciseSetDto,
//   ): Promise<ExerciseSet> {
//     const session = await this.sessionRepository.findOne({
//       where: { id: sessionId },
//     });
//     const exercise = await this.exerciseRepository.findOne({
//       where: { id: exerciseId },
//     });

//     if (!session || !exercise) {
//       throw new NotFoundException('Session or exercise not found');
//     }

//     const set = this.setRepository.create({
//       ...createSetDto,
//       session,
//       exercise,
//     });

//     return await this.setRepository.save(set);
//   }

//   async completeSession(
//     sessionId: string,
//     user: User,
//   ): Promise<WorkoutSession> {
//     const session = await this.sessionRepository.findOne({
//       where: { id: sessionId, user: { id: user.id } },
//     });

//     if (!session) {
//       throw new NotFoundException('Workout session not found');
//     }

//     session.isCompleted = true;
//     session.endTime = new Date();
//     return await this.sessionRepository.save(session);
//   }

//   async getUserWorkoutHistory(user: User): Promise<WorkoutSession[]> {
//     return await this.sessionRepository.find({
//       where: { user: { id: user.id } },
//       relations: ['routine', 'sets', 'sets.exercise'],
//       order: { startTime: 'DESC' },
//     });
//   }
// }
