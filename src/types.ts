export type Gender = 'male' | 'female';
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type Goal = 'lose' | 'lose_slow' | 'maintain' | 'gain_slow' | 'gain';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  gender: Gender | null;
  age: number;
  height: number;
  weight: number;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  tdee?: number;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface Meal {
  id: string;
  userId: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
