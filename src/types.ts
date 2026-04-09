export type Gender = 'male' | 'female';
export type ActivityLevel = 'baixo' | 'moderado' | 'alto' | 'muito_alto';
export type Goal = 'perder_peso' | 'manter' | 'ganhar_massa';

export interface User {
  id: string; // ID numérico do Oracle (PK)
  firebaseUid?: string; // UID real do Firebase Auth
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
