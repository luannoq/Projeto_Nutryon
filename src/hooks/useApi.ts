import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService, userService, apexService } from '../services/api';
import { Meal, User } from '../types';

// ─── HOOKS DE USUÁRIO ────────────────────────────────────────────────────────

export const useProfile = () => {
  return useQuery<User>({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
    },
  });
};

// ─── HOOK APEX — TDEE/MACROS ─────────────────────────────────────────────────
// Integra com fn_calcular_tdee do Oracle APEX
export const useApexMacros = (params: {
  peso: number;
  altura: number;
  idade: number;
  sexo: string;
  nivel_atividade: string;
  objetivo: string;
} | null) => {
  return useQuery({
    queryKey: ['apex_macros', params],
    queryFn: () => apexService.calcularMacros(params!),
    enabled: !!params, // só executa quando os dados do usuário estiverem disponíveis
    staleTime: 1000 * 60 * 30, // resultado válido por 30 min (cálculo não muda frequentemente)
    retry: 1,
  });
};

// ─── HOOKS DE REFEIÇÃO (CRUD completo) ───────────────────────────────────────

export const useMeals = () => {
  return useQuery<Meal[]>({
    queryKey: ['meals'],
    queryFn: mealService.list,
    retry: 1,
    // Enquanto não há dados em cache, mostra loading
    placeholderData: [],
  });
};

export const useCreateMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mealService.create,
    onSuccess: () => {
      // Invalida o cache de refeições → Dashboard e MealLog atualizam automaticamente
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
};

export const useUpdateMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, meal }: { id: string; meal: Partial<Meal> }) =>
      mealService.update(id, meal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
};

export const useDeleteMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mealService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
};
