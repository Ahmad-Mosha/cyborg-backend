import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import {
  UserContext,
  UserHealthContext,
} from '../interfaces/user-context.interface';

@Injectable()
export class ChatContextService {
  createUserContext(user: User): UserContext {
    return {
      name: `${user.firstName} ${user.lastName}`,
      health: user.health ? this.createHealthContext(user.health) : null,
    };
  }

  private createHealthContext(health: any): UserHealthContext {
    return {
      age: health.age,
      gender: health.gender,
      weight: health.weight,
      height: health.height,
      muscleMass: health.muscleMass,
      fatPercentage: health.fatPercentage,
      waterPercentage: health.waterPercentage,
      bmi: this.calculateBMI(health.weight, health.height),
      fitnessGoals: health.fitnessGoals,
      activityLevel: health.activityLevel,
      workoutLocation: health.workoutLocation,
      additionalNotes: health.additionalNotes,
      availableEquipment: health.availableEquipment,
      nationality: health.nationality,
    };
  }

  private calculateBMI(weight: number, height: number): number | null {
    if (!weight || !height) return null;
    return Number((weight / Math.pow(height / 100, 2)).toFixed(1));
  }

  formatUserProfileSection(context: UserContext): string {
    if (!context.health) {
      return `\n\nUser Profile - ${context.name}: No health data provided yet.`;
    }

    return `\n\nUser Profile - ${context.name}:
    - Age: ${context.health.age || 'Not provided'} years
    - Gender: ${context.health.gender || 'Not provided'}
    - Current weight: ${context.health.weight ? `${context.health.weight}kg` : 'Not provided'}
    - Height: ${context.health.height ? `${context.health.height}cm` : 'Not provided'}
    - BMI: ${context.health.bmi || 'Not calculated'}
    - Body composition:
      * Body fat: ${context.health.fatPercentage ? `${context.health.fatPercentage}%` : 'Not provided'}
      * Muscle mass: ${context.health.muscleMass ? `${context.health.muscleMass}kg` : 'Not provided'}
      * Water: ${context.health.waterPercentage ? `${context.health.waterPercentage}%` : 'Not provided'}
    - Goals: ${context.health.fitnessGoals || 'Not specified'}
    - Activity level: ${context.health.activityLevel || 'Not specified'}
    - Workout location: ${context.health.workoutLocation || 'Not specified'}
    - Additional notes: ${context.health.additionalNotes || 'None'}
    - Available equipment: ${context.health.availableEquipment?.length ? context.health.availableEquipment.join(', ') : 'None'}
    - Nationality: ${context.health.nationality || 'Not provided'}
    `;
  }
}
