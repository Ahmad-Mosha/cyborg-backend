export interface UserHealthContext {
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  muscleMass?: number;
  fatPercentage?: number;
  waterPercentage?: number;
  bmi?: number;
  fitnessGoals?: string;
  activityLevel?: string;
}

export interface UserContext {
  name: string;
  health: UserHealthContext | null;
}
