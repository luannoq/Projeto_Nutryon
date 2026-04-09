export interface Food {
  id: string;
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  portion: string;
}

export const FOOD_DATABASE: Food[] = [
  { id: '1', name: 'Arroz Branco Cozido', kcal: 130, p: 2.5, c: 28, f: 0.2, portion: '100g' },
  { id: '2', name: 'Feijão Carioca Cozido', kcal: 76, p: 4.8, c: 14, f: 0.5, portion: '100g' },
  { id: '3', name: 'Frango Grelhado (Peito)', kcal: 165, p: 31, c: 0, f: 3.6, portion: '100g' },
  { id: '4', name: 'Ovo Cozido', kcal: 155, p: 13, c: 1.1, f: 11, portion: '100g' },
  { id: '5', name: 'Banana Prata', kcal: 89, p: 1.1, c: 23, f: 0.3, portion: '100g' },
  { id: '6', name: 'Pão Integral', kcal: 250, p: 9, c: 45, f: 3.5, portion: '100g' },
  { id: '7', name: 'Azeite de Oliva', kcal: 884, p: 0, c: 0, f: 100, portion: '100ml' },
  { id: '8', name: 'Batata Doce Cozida', kcal: 86, p: 1.6, c: 20, f: 0.1, portion: '100g' },
  { id: '9', name: 'Carne Moída (Patinho)', kcal: 215, p: 26, c: 0, f: 12, portion: '100g' },
  { id: '10', name: 'Iogurte Natural', kcal: 63, p: 3.5, c: 5, f: 3.3, portion: '100g' },
];

export const ACTIVITY_MULTIPLIERS = {
  low: 1.2,
  moderate: 1.375,
  high: 1.55,
  very_high: 1.725,
};

export const GOAL_ADJUSTMENTS = {
  lose: 0.8,
  lose_slow: 0.9,
  maintain: 1.0,
  gain_slow: 1.1,
  gain: 1.2,
};
