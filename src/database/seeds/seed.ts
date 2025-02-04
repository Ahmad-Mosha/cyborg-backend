// import { NestFactory } from '@nestjs/core';
// import { AppModule } from '../../app.module';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { User } from '../../modules/users/entities/user.entity';
// import { WorkoutRoutine } from '../../modules/workouts/entities/workout-routine.entity';
// import { Exercise } from '../../modules/workouts/entities/exercise.entity';
// import { ExerciseSet } from '../../modules/workouts/entities/exercise-set.entity';
// import { WorkoutSession } from '../../modules/workouts/entities/workout-session.entity';
// import { Food } from '../../modules/nutrition/entities/food.entity';
// import {
//   Post,
//   PostType,
//   PostStatus,
// } from '../../modules/community/entities/post.entity';
// import * as bcrypt from 'bcrypt';

// async function bootstrap() {
//   const app = await NestFactory.createApplicationContext(AppModule);

//   // Get repositories
//   const userRepo = app.get(getRepositoryToken(User));
//   const routineRepo = app.get(getRepositoryToken(WorkoutRoutine));
//   const exerciseRepo = app.get(getRepositoryToken(Exercise));
//   const setRepo = app.get(getRepositoryToken(ExerciseSet));
//   const sessionRepo = app.get(getRepositoryToken(WorkoutSession));
//   const foodRepo = app.get(getRepositoryToken(Food));
//   const postRepo = app.get(getRepositoryToken(Post));

//   try {
//     // Create users
//     const hashedPassword = await bcrypt.hash('password123', 10);
//     const user1 = await userRepo.save({
//       email: 'john@example.com',
//       password: hashedPassword,
//       firstName: 'John',
//       lastName: 'Doe',
//       age: 30,
//       gender: 'male',
//       weight: 80,
//       height: 180,
//       fitnessGoals: 'Build muscle and strength',
//       dailyCalorieGoal: 2500,
//       dailyProteinGoal: 180,
//       dailyCarbsGoal: 250,
//       dailyFatGoal: 80,
//       roles: JSON.stringify(['user']),
//       workoutReminders: true,
//       mealReminders: true,
//       goalAlerts: true,
//       emailNotifications: true,
//       isActive: true,
//       preferredNotificationDays: JSON.stringify([
//         'MONDAY',
//         'WEDNESDAY',
//         'FRIDAY',
//       ]),
//     });

//     // Create workout routine
//     const routine = await routineRepo.save({
//       name: 'Full Body Workout',
//       description: 'Complete full body workout for strength',
//       isPublic: true,
//       creator: user1,
//       tags: JSON.stringify([]),
//       estimatedDuration: 60,
//       difficulty: 3,
//     });

//     // Create exercises
//     const exercise1 = await exerciseRepo.save({
//       name: 'Barbell Squat',
//       description: 'Compound lower body exercise',
//       targetMuscleGroup: 'Legs',
//       restPeriod: 120,
//       routine: routine,
//     });

//     const exercise2 = await exerciseRepo.save({
//       name: 'Bench Press',
//       description: 'Compound upper body push exercise',
//       targetMuscleGroup: 'Chest',
//       restPeriod: 120,
//       routine: routine,
//     });

//     // Create workout session
//     const session = await sessionRepo.save({
//       user: user1,
//       routine: routine,
//       startTime: new Date(),
//       endTime: new Date(Date.now() + 3600000),
//       notes: 'Great workout session',
//       userWeight: 80,
//       isCompleted: true,
//       mood: 4,
//       energyLevel: 4,
//     });

//     // Create exercise sets
//     await setRepo.save([
//       {
//         exercise: exercise1,
//         session: session,
//         setNumber: 1,
//         weight: 100,
//         reps: 8,
//         isWarmupSet: false,
//         rpe: 8,
//       },
//       {
//         exercise: exercise1,
//         session: session,
//         setNumber: 2,
//         weight: 100,
//         reps: 8,
//         isWarmupSet: false,
//         rpe: 8,
//       },
//     ]);

//     // Create food items
//     await foodRepo.save([
//       {
//         name: 'Chicken Breast',
//         brand: 'Generic',
//         servingSize: 100,
//         servingUnit: 'g',
//         calories: 165,
//         protein: 31,
//         carbs: 0,
//         fat: 3.6,
//         creator: user1,
//         isVerified: true,
//         tags: JSON.stringify([]),
//       },
//       {
//         name: 'Brown Rice',
//         brand: 'Generic',
//         servingSize: 100,
//         servingUnit: 'g',
//         calories: 111,
//         protein: 2.6,
//         carbs: 23,
//         fat: 0.9,
//         creator: user1,
//         isVerified: true,
//         tags: JSON.stringify([]),
//       },
//     ]);

//     // Create community posts
//     await postRepo.save({
//       title: 'My Fitness Journey',
//       content: 'Started my fitness journey 3 months ago...',
//       type: PostType.PROGRESS,
//       status: PostStatus.ACTIVE,
//       author: user1,
//       tags: JSON.stringify([]),
//       attachments: JSON.stringify([]),
//       likesCount: 0,
//       commentsCount: 0,
//     });

//     console.log('Database seeded successfully!');
//   } catch (error) {
//     console.error('Error seeding database:', error);
//   } finally {
//     await app.close();
//   }
// }

// bootstrap();
