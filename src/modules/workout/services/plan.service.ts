import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutPlan, PlanType } from '../entities/workout-plan.entity';
import { WorkoutDay } from '../entities/workout-day.entity';
import { WorkoutExercise } from '../entities/workout-exercise.entity';
import { ExerciseSet, SetType } from '../entities/exercise-set.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { User } from '../../users/entities/user.entity';
import { UserData } from '../../users/entities/user-data.entity';
import { CreateWorkoutPlanDto } from '../dto/create-workout-plan.dto';
import { AiChatService } from '../../chat/services/ai-chat.service';
import { ExercisesService } from '../../exercises/exercises.service';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(WorkoutPlan)
    private readonly workoutPlanRepository: Repository<WorkoutPlan>,
    @InjectRepository(WorkoutDay)
    private readonly workoutDayRepository: Repository<WorkoutDay>,
    @InjectRepository(WorkoutExercise)
    private readonly workoutExerciseRepository: Repository<WorkoutExercise>,
    @InjectRepository(ExerciseSet)
    private readonly exerciseSetRepository: Repository<ExerciseSet>,
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
    private readonly exercisesService: ExercisesService,
    private readonly aiChatService: AiChatService,
  ) {}

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
              for (let i = 0; i < exerciseDto.sets.length; i++) {
                const setDto = exerciseDto.sets[i];
                const exerciseSet = this.exerciseSetRepository.create({
                  setOrder: i + 1, // Automatic set ordering
                  reps: setDto.reps,
                  weight: setDto.weight,
                  notes: setDto.notes,
                  type: setDto.type || SetType.NORMAL,
                  restTimeSeconds: setDto.restTimeSeconds || 120,
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

  async deleteWorkoutPlan(userId: string, planId: string): Promise<void> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException(`Workout plan with ID ${planId} not found`);
    }

    // Soft delete by setting isActive to false
    plan.isActive = false;
    await this.workoutPlanRepository.save(plan);
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
              exerciseId: '0001',
              exerciseOrder: 1,
              notes: 'Focus on proper form and control',
              sets: [
                {
                  reps: 12,
                  weight: 0,
                  notes: 'Warm-up set',
                  type: SetType.WARM_UP,
                },
                {
                  reps: 10,
                  weight: 0,
                  notes: 'Working set',
                  type: SetType.NORMAL,
                },
                {
                  reps: 8,
                  weight: 0,
                  notes: 'Final set',
                  type: SetType.NORMAL,
                },
              ],
            },
          ],
        },
      ],
    };
  }
}