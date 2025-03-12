import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThan,
  LessThan,
  FindOptionsOrder,
} from 'typeorm';
import { WorkoutPlan, PlanType } from './entities/workout-plan.entity';
import { WorkoutDay } from './entities/workout-day.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { ExerciseSet } from './entities/exercise-set.entity';
import { WorkoutSession } from './entities/workout-session.entity';
import { CompletedExercise } from './entities/completed-exercise.entity';
import { CompletedSet } from './entities/completed-set.entity';
import { User } from '../users/entities/user.entity';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { StartWorkoutSessionDto } from './dto/start-workout-session.dto';
import { ExercisesService } from '../exercises/exercises.service';
import { UserData } from '../users/entities/user-data.entity';
import { UpdateCompletedSetDto } from './dto/update-completed-set.dto';
import { Exercise } from '../exercises/entities/exercise.entity';
import { AddWorkoutDayDto } from './dto/add-workout-day.dto';
import { AddWorkoutExerciseDto } from './dto/add-workout-exercise.dto';
import { AddExerciseSetDto } from './dto/add-exercise-set.dto';
import { WorkoutSessionResponseDto } from './dto/workout-session.response.dto';
import { AiChatService } from '../chat/services/ai-chat.service';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(WorkoutPlan)
    private workoutPlanRepository: Repository<WorkoutPlan>,
    @InjectRepository(WorkoutDay)
    private workoutDayRepository: Repository<WorkoutDay>,
    @InjectRepository(WorkoutExercise)
    private workoutExerciseRepository: Repository<WorkoutExercise>,
    @InjectRepository(ExerciseSet)
    private exerciseSetRepository: Repository<ExerciseSet>,
    @InjectRepository(WorkoutSession)
    private workoutSessionRepository: Repository<WorkoutSession>,
    @InjectRepository(CompletedExercise)
    private completedExerciseRepository: Repository<CompletedExercise>,
    @InjectRepository(CompletedSet)
    private completedSetRepository: Repository<CompletedSet>,
    @InjectRepository(Exercise)
    private exerciseRepository: Repository<Exercise>,
    private exercisesService: ExercisesService,
    private aiChatService: AiChatService,
  ) {}

  // Workout Plan Management
  async createWorkoutPlan(
    userId: string,
    createPlanDto: CreateWorkoutPlanDto,
  ): Promise<WorkoutPlan> {
    const plan = this.workoutPlanRepository.create({
      name: createPlanDto.name,
      description: createPlanDto.description,
      type: createPlanDto.type || PlanType.CUSTOM,
      user: { id: userId },
      days: [],
    });

    // Create workout days with their exercises and sets
    if (createPlanDto.days && createPlanDto.days.length > 0) {
      for (const dayDto of createPlanDto.days) {
        const day = this.workoutDayRepository.create({
          name: dayDto.name,
          description: dayDto.description,
          dayOrder: dayDto.dayOrder,
          exercises: [],
        });

        // Create exercises with their sets
        if (dayDto.exercises && dayDto.exercises.length > 0) {
          for (const exerciseDto of dayDto.exercises) {
            // Try to find the exercise in our database
            let exercise = await this.exerciseRepository.findOneBy({
              id: exerciseDto.exerciseId,
            });

            if (!exercise && /^\d+$/.test(exerciseDto.exerciseId)) {
              try {
                const apiExercise = await this.exercisesService.getExerciseById(
                  exerciseDto.exerciseId,
                );

                if (!apiExercise) {
                  throw new NotFoundException(
                    `Exercise with ID ${exerciseDto.exerciseId} not found in external API`,
                  );
                }

                // Save it to our database first
                exercise = this.exerciseRepository.create({
                  id: apiExercise.id,
                  name: apiExercise.name,
                  bodyPart: apiExercise.bodyPart,
                  equipment: apiExercise.equipment,
                  gifUrl: apiExercise.gifUrl,
                  target: apiExercise.target,
                  secondaryMuscles: apiExercise.secondaryMuscles || [],
                  instructions: apiExercise.instructions || [],
                });

                exercise = await this.exerciseRepository.save(exercise);
              } catch (error) {
                throw new NotFoundException(
                  `Could not find or retrieve exercise with ID ${exerciseDto.exerciseId}`,
                );
              }
            }

            if (!exercise) {
              throw new NotFoundException(
                `Exercise with ID ${exerciseDto.exerciseId} not found`,
              );
            }

            const workoutExercise = this.workoutExerciseRepository.create({
              exerciseOrder: exerciseDto.exerciseOrder,
              notes: exerciseDto.notes,
              exercise: exercise,
              sets: [],
            });

            // Create sets for this exercise
            if (exerciseDto.sets && exerciseDto.sets.length > 0) {
              for (const setDto of exerciseDto.sets) {
                const exerciseSet = this.exerciseSetRepository.create({
                  setOrder: setDto.setOrder,
                  reps: setDto.reps,
                  weight: setDto.weight,
                  notes: setDto.notes,
                });
                workoutExercise.sets.push(exerciseSet);
              }
            }
            day.exercises.push(workoutExercise);
          }
        }
        plan.days.push(day);
      }
    }

    return this.workoutPlanRepository.save(plan);
  }

  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return this.workoutPlanRepository.find({
      where: { user: { id: userId }, isActive: true },
      relations: [
        'days',
        'days.exercises',
        'days.exercises.exercise',
        'days.exercises.sets',
      ],
      order: {
        createdAt: 'DESC',
        days: {
          dayOrder: 'ASC',
          exercises: {
            exerciseOrder: 'ASC',
            sets: {
              setOrder: 'ASC',
            },
          },
        },
      },
    });
  }

  async getWorkoutPlanById(
    userId: string,
    planId: string,
  ): Promise<WorkoutPlan> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
      relations: [
        'days',
        'days.exercises',
        'days.exercises.exercise',
        'days.exercises.sets',
      ],
      order: {
        days: {
          dayOrder: 'ASC',
          exercises: {
            exerciseOrder: 'ASC',
            sets: {
              setOrder: 'ASC',
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    return plan;
  }

  // AI Workout Plan Generation
  async generateAIWorkoutPlan(
    userId: string,
    userData: UserData,
  ): Promise<WorkoutPlan> {
    try {
      // First, fetch the user object to pass to the AI service
      const user = await this.workoutPlanRepository.manager.findOne(User, {
        where: { id: userId },
        relations: ['health'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Create a new conversation for this workout plan generation
      const conversation = await this.aiChatService.startNewConversation(user);

      // Construct a detailed prompt for workout plan generation
      const prompt = this.buildWorkoutPlanPrompt(userData);

      // Send the prompt to Gemini AI
      const aiResponse = await this.aiChatService.sendMessage(
        user,
        conversation.id,
        prompt,
      );

      // Parse the AI response to create a workout plan
      const planDto = await this.parseAiResponseToWorkoutPlan(
        aiResponse.content,
      );

      // Delete the temporary conversation
      await this.aiChatService.deleteConversation(user, conversation.id);

      // Create the actual workout plan using the parsed DTO
      return this.createWorkoutPlan(userId, planDto);
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate AI workout plan: ${error.message || 'AI error'}`,
      );
    }
  }

  /**
   * Builds a detailed prompt for the AI to generate a workout plan
   */
  private buildWorkoutPlanPrompt(userData: UserData): string {
    // Create a base prompt with detailed instructions
    let prompt = `Create a personalized workout plan for me based on my fitness profile. 
The workout plan should be detailed, realistic, and optimized for my specific goals and constraints.

MY FITNESS PROFILE:
`;

    // Add all available user data to the prompt
    if (userData) {
      if (userData.age) prompt += `- Age: ${userData.age} years\n`;
      if (userData.gender) prompt += `- Gender: ${userData.gender}\n`;
      if (userData.weight) prompt += `- Weight: ${userData.weight}kg\n`;
      if (userData.height) prompt += `- Height: ${userData.height}cm\n`;
      if (userData.bmi) prompt += `- BMI: ${userData.bmi}\n`;
      if (userData.muscleMass)
        prompt += `- Muscle mass: ${userData.muscleMass}kg\n`;
      if (userData.fatPercentage)
        prompt += `- Body fat: ${userData.fatPercentage}%\n`;
      if (userData.waterPercentage)
        prompt += `- Water percentage: ${userData.waterPercentage}%\n`;
      if (userData.fitnessGoals)
        prompt += `- Fitness goals: ${userData.fitnessGoals}\n`;
      if (userData.activityLevel)
        prompt += `- Activity level: ${userData.activityLevel}\n`;
      if (userData.workoutLocation)
        prompt += `- Workout location: ${userData.workoutLocation}\n`;
      if (userData.additionalNotes)
        prompt += `- Additional notes: ${userData.additionalNotes}\n`;
      if (
        userData.availableEquipment &&
        userData.availableEquipment.length > 0
      ) {
        prompt += `- Available equipment: ${userData.availableEquipment.join(', ')}\n`;
      }
    }

    // Add instructions for the plan format
    prompt += `\nI need a workout plan with the following specifications:
1. Format the plan as a valid JSON object matching this exact structure:
{
  "name": "Plan Name",
  "description": "Brief description of the overall plan",
  "type": "ai_generated",
  "days": [
    {
      "name": "Day 1: Type (Push/Pull/Legs/etc.)",
      "description": "Focus of this workout day",
      "dayOrder": 1,
      "exercises": [
        {
          "exerciseId": "0001",  // Use realistic exercise IDs (4 digit numbers)
          "exerciseOrder": 1,
          "notes": "Form tips or other notes",
          "sets": [
            {
              "setOrder": 1,
              "reps": 12,
              "weight": 45,
              "notes": "Warm-up set"
            },
            {
              "setOrder": 2,
              "reps": 10,
              "weight": 55,
              "notes": "Working set"
            },
            {
              "setOrder": 3,
              "reps": 8,
              "weight": 65,
              "notes": "Final set"
            }
          ]
        }
        // Add more exercises here
      ]
    }
    // Add more days here
  ]
}

2. Important requirements:
- Exercise IDs should be realistic 4-digit numbers (e.g., "0001", "0025", "0305")
- Include 3-5 days of workouts, depending on my experience level and goals
- Each day should have 4-6 exercises
- Each exercise should have 3 sets with appropriate reps (8-15) based on the goal
- Provide meaningful notes for each set and exercise
- Make sure the plan follows best practices for exercise selection and order
- Use appropriate weight recommendations based on the exercise (use 0 for bodyweight exercises)
- Ensure each day has a balanced mix of exercises targeting the day's focus areas

Important: The response should be ONLY the JSON object with no additional text or explanation.`;

    return prompt;
  }

  /**
   * Parses the AI response and creates a workout plan DTO
   */
  private async parseAiResponseToWorkoutPlan(
    aiResponse: string,
  ): Promise<CreateWorkoutPlanDto> {
    try {
      // Extract the JSON from the AI response
      const jsonRegex = /{[\s\S]*}/g;
      const jsonMatch = aiResponse.match(jsonRegex);

      if (!jsonMatch || jsonMatch.length === 0) {
        throw new Error('Could not extract valid JSON from the AI response');
      }

      const jsonStr = jsonMatch[0];
      const planData = JSON.parse(jsonStr);

      // Validate the parsed data has the expected structure
      if (!planData.name || !planData.days || !Array.isArray(planData.days)) {
        throw new Error(
          'The AI response does not contain a valid workout plan structure',
        );
      }

      // Validate and ensure each exercise has a proper ID
      const planDto: CreateWorkoutPlanDto = {
        name: planData.name,
        description: planData.description || 'AI Generated Workout Plan',
        type: PlanType.AI_GENERATED,
        days: [],
      };

      // Process each day
      for (let i = 0; i < planData.days.length; i++) {
        const dayData = planData.days[i];

        if (
          !dayData.name ||
          !dayData.exercises ||
          !Array.isArray(dayData.exercises)
        ) {
          continue; // Skip invalid days
        }

        const day = {
          name: dayData.name,
          description: dayData.description || `Workout day ${i + 1}`,
          dayOrder: dayData.dayOrder || i + 1,
          exercises: [],
        };

        // Process each exercise
        for (let j = 0; j < dayData.exercises.length; j++) {
          const exerciseData = dayData.exercises[j];

          if (!exerciseData.exerciseId) {
            continue; // Skip invalid exercises
          }

          // Verify the exercise ID is valid and exists (or can be fetched)
          const exerciseId = exerciseData.exerciseId;
          let exerciseExists = false;

          // Check if the exercise exists in our database
          const existingExercise = await this.exerciseRepository.findOneBy({
            id: exerciseId,
          });

          if (existingExercise) {
            exerciseExists = true;
          } else if (/^\d+$/.test(exerciseId)) {
            // Try to fetch it from the API if it looks like a valid ID
            try {
              const apiExercise =
                await this.exercisesService.getExerciseById(exerciseId);

              if (apiExercise) {
                // Save it to our database
                const newExercise = this.exerciseRepository.create({
                  id: apiExercise.id,
                  name: apiExercise.name,
                  bodyPart: apiExercise.bodyPart,
                  equipment: apiExercise.equipment,
                  gifUrl: apiExercise.gifUrl,
                  target: apiExercise.target,
                  secondaryMuscles: apiExercise.secondaryMuscles || [],
                  instructions: apiExercise.instructions || [],
                });

                await this.exerciseRepository.save(newExercise);
                exerciseExists = true;
              }
            } catch (error) {
              // Exercise doesn't exist in API either
              console.error(
                `Could not fetch exercise ID ${exerciseId}: ${error.message}`,
              );
            }
          }

          // Only add exercises that exist or could be fetched
          if (exerciseExists) {
            const exercise = {
              exerciseId: exerciseId,
              exerciseOrder: exerciseData.exerciseOrder || j + 1,
              notes: exerciseData.notes || 'Focus on proper form',
              sets: [],
            };

            // Process each set
            if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
              for (let k = 0; k < exerciseData.sets.length; k++) {
                const setData = exerciseData.sets[k];

                if (setData) {
                  exercise.sets.push({
                    setOrder: setData.setOrder || k + 1,
                    reps: setData.reps || 10,
                    weight: setData.weight || 0,
                    notes: setData.notes || '',
                  });
                }
              }
            } else {
              // Default sets if none provided
              exercise.sets = [
                { setOrder: 1, reps: 12, weight: 0, notes: 'Warm-up set' },
                { setOrder: 2, reps: 10, weight: 0, notes: 'Working set' },
                { setOrder: 3, reps: 8, weight: 0, notes: 'Final set' },
              ];
            }

            day.exercises.push(exercise);
          }
        }

        // Only add days that have valid exercises
        if (day.exercises.length > 0) {
          planDto.days.push(day);
        }
      }

      // Ensure we have at least one valid day
      if (planDto.days.length === 0) {
        throw new Error(
          'Could not create any valid workout days from the AI response',
        );
      }

      return planDto;
    } catch (error) {
      // If parsing fails, create a fallback plan
      console.error('Error parsing AI response:', error);
      return this.createFallbackWorkoutPlan();
    }
  }

  /**
   * Creates a fallback workout plan in case the AI response parsing fails
   */
  private createFallbackWorkoutPlan(): CreateWorkoutPlanDto {
    // Simple 3-day full body plan as a fallback
    return {
      name: 'AI Generated Full Body Plan',
      description: 'A balanced full-body workout plan for general fitness',
      type: PlanType.AI_GENERATED,
      days: [
        {
          name: 'Day 1: Full Body',
          description: 'Full body workout focusing on compound movements',
          dayOrder: 1,
          exercises: [
            {
              exerciseId: '0001', // This ID should be validated separately
              exerciseOrder: 1,
              notes: 'Focus on proper form and control',
              sets: [
                { setOrder: 1, reps: 12, weight: 0, notes: 'Warm-up set' },
                { setOrder: 2, reps: 10, weight: 0, notes: 'Working set' },
                { setOrder: 3, reps: 8, weight: 0, notes: 'Final set' },
              ],
            },
            // More exercises would be added here in a real fallback
          ],
        },
        // More days would be added here in a real fallback
      ],
    };
  }

  // Workout Session Management
  async startWorkoutSession(
    userId: string,
    startDto: StartWorkoutSessionDto,
  ): Promise<WorkoutSessionResponseDto> {
    // Check if the user already has an active session
    const activeSession = await this.getActiveWorkoutSession(userId);
    if (activeSession) {
      throw new BadRequestException(
        'You already have an active workout session. Please complete or cancel it before starting a new one.',
      );
    }

    const session = this.workoutSessionRepository.create({
      name: startDto.name,
      notes: startDto.notes,
      startTime: startDto.startTime || new Date(),
      user: { id: userId },
    });

    // If plan and day are specified, link them and pre-populate exercises
    if (startDto.planId && startDto.dayId) {
      const plan = await this.workoutPlanRepository.findOne({
        where: { id: startDto.planId, user: { id: userId } },
      });

      if (!plan) {
        throw new NotFoundException(
          `Workout plan with ID ${startDto.planId} not found`,
        );
      }

      const day = await this.workoutDayRepository.findOne({
        where: { id: startDto.dayId, plan: { id: startDto.planId } },
        relations: ['exercises', 'exercises.exercise', 'exercises.sets'],
      });

      if (!day) {
        throw new NotFoundException(
          `Workout day with ID ${startDto.dayId} not found`,
        );
      }

      session.plan = plan;
      session.day = day;

      await this.workoutSessionRepository.save(session);

      // Pre-populate completed exercises and sets from the workout day template
      for (const exercise of day.exercises) {
        const completedExercise = this.completedExerciseRepository.create({
          exerciseOrder: exercise.exerciseOrder,
          notes: exercise.notes,
          exercise: exercise.exercise,
          session,
          sets: [],
        });

        // Create sets
        for (const set of exercise.sets) {
          const completedSet = this.completedSetRepository.create({
            setOrder: set.setOrder,
            reps: set.reps,
            weight: set.weight,
            notes: set.notes,
          });

          completedExercise.sets.push(completedSet);
        }

        await this.completedExerciseRepository.save(completedExercise);
      }
    } else {
      // If no plan/day specified, just create an empty session
      await this.workoutSessionRepository.save(session);
    }

    const savedSession = await this.workoutSessionRepository.findOne({
      where: { id: session.id },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.sets',
        'plan',
        'day',
      ],
    });

    return WorkoutSessionResponseDto.fromEntity(savedSession);
  }

  async completeWorkoutSession(
    userId: string,
    sessionId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) {
      throw new NotFoundException(
        `Workout session with ID ${sessionId} not found`,
      );
    }

    if (session.isCompleted) {
      throw new BadRequestException(
        'This workout session is already completed',
      );
    }

    // Set end time to now
    const endTime = new Date();
    session.endTime = endTime;
    session.isCompleted = true;

    // Calculate duration in minutes
    const startTime = new Date(session.startTime).getTime();
    const endTimeMs = endTime.getTime();
    session.durationMinutes = Math.round((endTimeMs - startTime) / (1000 * 60));

    const savedSession = await this.workoutSessionRepository.save(session);

    const completeSession = await this.workoutSessionRepository.findOne({
      where: { id: savedSession.id },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.sets',
        'plan',
        'day',
      ],
    });

    return WorkoutSessionResponseDto.fromEntity(completeSession);
  }

  async getActiveWorkoutSession(
    userId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const session = await this.workoutSessionRepository.findOne({
      where: { user: { id: userId }, isCompleted: false },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.sets',
        'plan',
        'day',
      ],
    });

    if (!session) return null;
    return WorkoutSessionResponseDto.fromEntity(session);
  }

  async getUserWorkoutHistory(
    userId: string,
  ): Promise<WorkoutSessionResponseDto[]> {
    const sessions = await this.workoutSessionRepository.find({
      where: { user: { id: userId }, isCompleted: true },
      relations: [
        'exercises',
        'exercises.exercise',
        'exercises.sets',
        'plan',
        'day',
      ],
      order: { startTime: 'DESC' },
    });

    return WorkoutSessionResponseDto.fromEntities(sessions);
  }

  // Analytics
  async getExerciseHistory(userId: string, exerciseId: string) {
    const completedExercises = await this.completedExerciseRepository.find({
      where: {
        exercise: { id: exerciseId },
        session: { user: { id: userId }, isCompleted: true },
      },
      relations: ['sets', 'session'],
      order: { session: { startTime: 'DESC' } } as any,
    });

    return completedExercises.map((exercise) => ({
      date: exercise.session.startTime,
      sets: exercise.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight,
      })),
    }));
  }

  async getWorkoutAnalytics(userId: string) {
    // Get completed workout stats
    const completedWorkouts = await this.workoutSessionRepository.count({
      where: { user: { id: userId }, isCompleted: true },
    });

    // Get today's date with time set to 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's date with time set to 00:00:00
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get first day of current week (Sunday)
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());

    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get workout count by time period
    const workoutsToday = await this.workoutSessionRepository.count({
      where: {
        user: { id: userId },
        isCompleted: true,
        startTime: Between(today, new Date()),
      },
    });

    const workoutsYesterday = await this.workoutSessionRepository.count({
      where: {
        user: { id: userId },
        isCompleted: true,
        startTime: Between(yesterday, today),
      },
    });

    const workoutsThisWeek = await this.workoutSessionRepository.count({
      where: {
        user: { id: userId },
        isCompleted: true,
        startTime: Between(firstDayOfWeek, new Date()),
      },
    });

    const workoutsThisMonth = await this.workoutSessionRepository.count({
      where: {
        user: { id: userId },
        isCompleted: true,
        startTime: Between(firstDayOfMonth, new Date()),
      },
    });

    // Get most frequent exercises
    const mostFrequentExercises = await this.completedExerciseRepository
      .createQueryBuilder('completedExercise')
      .select('exercise.name', 'exerciseName')
      .addSelect('COUNT(completedExercise.id)', 'count')
      .innerJoin('completedExercise.exercise', 'exercise')
      .innerJoin('completedExercise.session', 'session')
      .where('session.user.id = :userId', { userId })
      .andWhere('session.isCompleted = :isCompleted', { isCompleted: true })
      .groupBy('exercise.id')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    // Get total volume (weight × reps) per body part
    const volumeByBodyPart = await this.completedSetRepository
      .createQueryBuilder('completedSet')
      .select('exercise.bodyPart', 'bodyPart')
      .addSelect('SUM(completedSet.weight * completedSet.reps)', 'totalVolume')
      .innerJoin('completedSet.completedExercise', 'completedExercise')
      .innerJoin('completedExercise.exercise', 'exercise')
      .innerJoin('completedExercise.session', 'session')
      .where('session.user.id = :userId', { userId })
      .andWhere('session.isCompleted = :isCompleted', { isCompleted: true })
      .groupBy('exercise.bodyPart')
      .orderBy('totalVolume', 'DESC')
      .getRawMany();

    return {
      totalWorkouts: completedWorkouts,
      workoutsToday,
      workoutsYesterday,
      workoutsThisWeek,
      workoutsThisMonth,
      mostFrequentExercises,
      volumeByBodyPart,
    };
  }

  // Update a completed set during a workout
  async updateCompletedSet(
    userId: string,
    setId: string,
    updateDto: UpdateCompletedSetDto,
  ): Promise<CompletedSet> {
    // Find the set and verify it belongs to the user's active session
    const set = await this.completedSetRepository.findOne({
      where: { id: setId },
      relations: [
        'completedExercise',
        'completedExercise.session',
        'completedExercise.session.user',
      ],
    });

    if (!set) {
      throw new NotFoundException(`Set with ID ${setId} not found`);
    }

    // Verify the set belongs to the user
    if (set.completedExercise.session.user.id !== userId) {
      throw new BadRequestException(
        'You are not authorized to update this set',
      );
    }

    // Verify the session is still active
    if (set.completedExercise.session.isCompleted) {
      throw new BadRequestException(
        'Cannot update sets in a completed workout session',
      );
    }

    // Update the set
    if (updateDto.reps !== undefined) {
      set.reps = updateDto.reps;
    }

    if (updateDto.weight !== undefined) {
      set.weight = updateDto.weight;
    }

    if (updateDto.notes !== undefined) {
      set.notes = updateDto.notes;
    }

    return this.completedSetRepository.save(set);
  }

  // Add a new day to a workout plan
  async addWorkoutDay(
    userId: string,
    planId: string,
    dayDto: AddWorkoutDayDto,
  ): Promise<WorkoutDay> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
      relations: ['days'],
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    // Create a new workout day
    const day = this.workoutDayRepository.create({
      name: dayDto.name,
      description: dayDto.description,
      dayOrder: dayDto.dayOrder,
      plan: plan,
    });

    return this.workoutDayRepository.save(day);
  }

  // Add a new exercise to a workout day
  async addWorkoutExercise(
    userId: string,
    planId: string,
    dayId: string,
    exerciseDto: AddWorkoutExerciseDto,
  ): Promise<WorkoutExercise> {
    // Verify the plan belongs to the user
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    // Verify the day belongs to the plan
    const day = await this.workoutDayRepository.findOne({
      where: { id: dayId, plan: { id: planId } },
      relations: ['exercises'],
    });

    if (!day) {
      throw new NotFoundException(
        `Workout day with ID ${dayId} not found in plan ${planId}`,
      );
    }

    // Try to find the exercise in our database
    let exercise = await this.exerciseRepository.findOneBy({
      id: exerciseDto.exerciseId,
    });

    // If not found in database but appears to be an external ID (e.g., numeric format),
    // fetch it from the external API and save to our database
    if (!exercise && /^\d+$/.test(exerciseDto.exerciseId)) {
      try {
        // Get the exercise from external API
        const apiExercise = await this.exercisesService.getExerciseById(
          exerciseDto.exerciseId,
        );

        if (!apiExercise) {
          throw new NotFoundException(
            `Exercise with ID ${exerciseDto.exerciseId} not found in external API`,
          );
        }

        // Save it to our database first
        exercise = this.exerciseRepository.create({
          id: apiExercise.id,
          name: apiExercise.name,
          bodyPart: apiExercise.bodyPart,
          equipment: apiExercise.equipment,
          gifUrl: apiExercise.gifUrl,
          target: apiExercise.target,
          secondaryMuscles: apiExercise.secondaryMuscles || [],
          instructions: apiExercise.instructions || [],
        });

        exercise = await this.exerciseRepository.save(exercise);
      } catch (error) {
        throw new NotFoundException(
          `Could not find or retrieve exercise with ID ${exerciseDto.exerciseId}`,
        );
      }
    }

    if (!exercise) {
      throw new NotFoundException(
        `Exercise with ID ${exerciseDto.exerciseId} not found`,
      );
    }

    // Create the workout exercise
    const workoutExercise = this.workoutExerciseRepository.create({
      exerciseOrder: exerciseDto.exerciseOrder,
      notes: exerciseDto.notes,
      exercise: exercise,
      day: day,
    });

    return this.workoutExerciseRepository.save(workoutExercise);
  }

  // Add a set to a workout exercise
  async addExerciseSet(
    userId: string,
    planId: string,
    dayId: string,
    exerciseId: string,
    setDto: AddExerciseSetDto,
  ): Promise<ExerciseSet> {
    // Verify the plan belongs to the user
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    // Verify the day belongs to the plan
    const day = await this.workoutDayRepository.findOne({
      where: { id: dayId, plan: { id: planId } },
    });

    if (!day) {
      throw new NotFoundException(
        `Workout day with ID ${dayId} not found in plan ${planId}`,
      );
    }

    // Verify the exercise belongs to the day
    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: { id: exerciseId, day: { id: dayId } },
      relations: ['sets'],
    });

    if (!workoutExercise) {
      throw new NotFoundException(
        `Exercise with ID ${exerciseId} not found in day ${dayId}`,
      );
    }

    // Create the exercise set
    const exerciseSet = this.exerciseSetRepository.create({
      setOrder: setDto.setOrder,
      reps: setDto.reps,
      weight: setDto.weight,
      notes: setDto.notes,
      workoutExercise: workoutExercise,
    });

    return this.exerciseSetRepository.save(exerciseSet);
  }

  // Delete a workout plan
  async deleteWorkoutPlan(userId: string, planId: string): Promise<void> {
    // Find the plan with all its related entities
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
      relations: ['days', 'days.exercises', 'days.exercises.sets'],
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    // First, check if there are any workout sessions using this plan
    const sessions = await this.workoutSessionRepository.find({
      where: { plan: { id: planId } },
      relations: ['exercises', 'exercises.sets'],
    });

    // Delete any sessions associated with this plan first
    for (const session of sessions) {
      // Delete completed exercises and their sets
      for (const exercise of session.exercises) {
        if (exercise.sets && exercise.sets.length > 0) {
          await this.completedSetRepository.remove(exercise.sets);
        }
        await this.completedExerciseRepository.remove(exercise);
      }

      // Delete the session
      await this.workoutSessionRepository.remove(session);
    }

    // Now delete the plan's days, exercises and sets
    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        // Delete all sets for this exercise
        if (exercise.sets && exercise.sets.length > 0) {
          await this.exerciseSetRepository.remove(exercise.sets);
        }

        // Now delete the exercise
        await this.workoutExerciseRepository.remove(exercise);
      }

      // Now delete the day
      await this.workoutDayRepository.remove(day);
    }

    // Finally delete the plan itself
    await this.workoutPlanRepository.remove(plan);
  }

  // Delete a workout day
  async deleteWorkoutDay(
    userId: string,
    planId: string,
    dayId: string,
  ): Promise<void> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    const day = await this.workoutDayRepository.findOne({
      where: { id: dayId, plan: { id: planId } },
      relations: ['exercises', 'exercises.sets'],
    });

    if (!day) {
      throw new NotFoundException(
        `Workout day with ID ${dayId} not found in plan ${planId}`,
      );
    }

    // First, check for any workout sessions using this day
    const sessions = await this.workoutSessionRepository.find({
      where: { day: { id: dayId } },
      relations: ['exercises', 'exercises.sets'],
    });

    // Delete any sessions associated with this day first
    for (const session of sessions) {
      // Delete completed exercises and their sets
      for (const exercise of session.exercises) {
        if (exercise.sets && exercise.sets.length > 0) {
          await this.completedSetRepository.remove(exercise.sets);
        }
        await this.completedExerciseRepository.remove(exercise);
      }

      // Delete the session
      await this.workoutSessionRepository.remove(session);
    }

    // Delete each exercise and its sets manually for reliable deletion
    for (const exercise of day.exercises) {
      // Delete all sets first
      if (exercise.sets && exercise.sets.length > 0) {
        await this.exerciseSetRepository.remove(exercise.sets);
      }

      // Then delete the exercise
      await this.workoutExerciseRepository.remove(exercise);
    }

    // Finally delete the day
    await this.workoutDayRepository.remove(day);
  }

  // Delete a workout exercise
  async deleteWorkoutExercise(
    userId: string,
    planId: string,
    dayId: string,
    exerciseId: string,
  ): Promise<void> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    const day = await this.workoutDayRepository.findOne({
      where: { id: dayId, plan: { id: planId } },
    });

    if (!day) {
      throw new NotFoundException(
        `Workout day with ID ${dayId} not found in plan ${planId}`,
      );
    }

    const exercise = await this.workoutExerciseRepository.findOne({
      where: { id: exerciseId, day: { id: dayId } },
      relations: ['sets'],
    });

    if (!exercise) {
      throw new NotFoundException(
        `Exercise with ID ${exerciseId} not found in day ${dayId}`,
      );
    }

    // First, delete all sets for this exercise
    if (exercise.sets && exercise.sets.length > 0) {
      await this.exerciseSetRepository.remove(exercise.sets);
    }

    // Then delete the exercise
    await this.workoutExerciseRepository.remove(exercise);
  }

  // Delete an exercise set
  async deleteExerciseSet(
    userId: string,
    planId: string,
    dayId: string,
    exerciseId: string,
    setId: string,
  ): Promise<void> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    const day = await this.workoutDayRepository.findOne({
      where: { id: dayId, plan: { id: planId } },
    });

    if (!day) {
      throw new NotFoundException(
        `Workout day with ID ${dayId} not found in plan ${planId}`,
      );
    }

    const exercise = await this.workoutExerciseRepository.findOne({
      where: { id: exerciseId, day: { id: dayId } },
    });

    if (!exercise) {
      throw new NotFoundException(
        `Exercise with ID ${exerciseId} not found in day ${dayId}`,
      );
    }

    const set = await this.exerciseSetRepository.findOne({
      where: { id: setId, workoutExercise: { id: exerciseId } },
    });

    if (!set) {
      throw new NotFoundException(
        `Set with ID ${setId} not found in exercise ${exerciseId}`,
      );
    }

    await this.exerciseSetRepository.remove(set);
  }
}
