import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// ── URL correta para o free tier do Oracle APEX ──────────────────────────────
// NÃO use oracleapex.com/ords — causa redirect SSL bloqueado no Android.
// O path /pls/apex/ é obrigatório no free tier.
const APEX_BASE = 'https://apex.oracle.com/pls/apex/projeto_nutryon/api';

// Instância Axios sem baseURL — URLs completas em cada chamada evitam
// qualquer ambiguidade de concatenação de barras.
const api = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// ── Interceptor de log para debug — remova antes de gravar o vídeo ──────────
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(`[API ERROR] ${err.config?.url}`, err.response?.status, err.message);
    return Promise.reject(err);
  }
);

// ── Helper: ID do usuário logado ─────────────────────────────────────────────
const getStoredUserId = async (): Promise<string | null> => {
  try {
    const json = await AsyncStorage.getItem('nutryon_user');
    if (json) {
      const user = JSON.parse(json);
      const id = String(user.id || '');
      // Retorna o ID só se for numérico. Se for UID do Firebase (letras), retorna null.
      return /^\d+$/.test(id) ? id : null;
    }
  } catch {}
  return null;
};

// ── FIREBASE AUTH ─────────────────────────────────────────────────────────────

export const userService = {
  getProfile: async () => ({ id: '1', name: 'Usuário', email: '', goal: 'maintain' }),
  updateProfile: async (user: any) => user,

  register: async (user: any) => {
    const cred  = await createUserWithEmailAndPassword(auth, user.email, user.password);
    const token = await cred.user.getIdToken();
    return { token, user: { id: cred.user.uid, name: user.name, email: user.email } };
  },

  login: async (credentials: any) => {
    const cred  = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const token = await cred.user.getIdToken();
    return { token, user: { id: cred.user.uid, name: 'Usuário', email: credentials.email } };
  },

  // ── Oracle APEX — POST /api/usuarios/ ──────────────────────────────────────
  // Retorna o id_usuario real do banco para substituir o UID do Firebase
  // como chave primária de refeições.
  syncProfileToOracle: async (payload: {
    nome: string; email: string; senha_hash: string;
    idade: number; altura: number; peso: number; objetivo: string | null;
  }) => {
    const { data } = await api.post(`${APEX_BASE}/usuarios/`, payload);
    return { ...data, id: String(data.id_usuario || data.id || '') };
  },
};

// ── CRUD DE REFEIÇÕES — Oracle APEX ──────────────────────────────────────────

export const mealService = {

  // GET /api/refeicoes/?id_usuario=X
  list: async () => {
    try {
      const userId = await getStoredUserId();
      // Se não tiver ID numérico, nem bate no Oracle para não dar erro 500/400
      if (!userId) return []; 
      
      const { data } = await api.get(`${APEX_BASE}/refeicoes/`, {
        params: { id_usuario: userId },
      });
      return (data?.items ?? []).map((item: any) => ({
        id:        String(item.id_refeicao),
        name:      item.nome_refeicao,
        kcal:      Number(item.calorias      ?? 0),
        protein:   Number(item.proteinas     ?? 0),
        carbs:     Number(item.carboidratos  ?? 0),
        fat:       Number(item.gorduras      ?? 0),
        userId:    String(item.id_usuario),
        timestamp: item.data_registro ?? new Date().toISOString(),
      }));
    } catch (e: any) {
      console.error('[mealService.list]', e.message);
      return [];
    }
  },

  // POST /api/refeicoes/
  create: async (meal: any) => {
    const userId = await getStoredUserId();
    const { data } = await api.post(`${APEX_BASE}/refeicoes/`, {
      id_usuario:    Number(userId),
      nome_refeicao: meal.name,
      calorias:      Number(meal.kcal     ?? 0),
      proteinas:     Number(meal.protein  ?? 0),
      carboidratos:  Number(meal.carbs    ?? 0),
      gorduras:      Number(meal.fat      ?? 0),
    });
    return data;
  },

  // PUT /api/refeicoes/:id
  update: async (id: string, meal: any) => {
    const { data } = await api.put(`${APEX_BASE}/refeicoes/${id}`, {
      nome_refeicao: meal.name,
      calorias:      Number(meal.kcal     ?? 0),
      proteinas:     Number(meal.protein  ?? 0),
      carboidratos:  Number(meal.carbs    ?? 0),
      gorduras:      Number(meal.fat      ?? 0),
    });
    return data;
  },

  // DELETE /api/refeicoes/:id
  delete: async (id: string) => {
    await api.delete(`${APEX_BASE}/refeicoes/${id}`);
  },
};

// ── CÁLCULO DE TDEE/MACROS — PL/SQL no APEX ──────────────────────────────────

export const apexService = {
  calcularMacros: async (params: {
    peso: number; altura: number; idade: number;
    sexo: string; nivel_atividade: string; objetivo: string;
  }) => {
    const { data } = await api.post(`${APEX_BASE}/calcular_macros/`, params);
    return {
      tdee:   Number(data.tdee),
      macros: {
        protein: Number(data.proteinas),
        carbs:   Number(data.carboidratos),
        fat:     Number(data.gorduras),
      },
    };
  },
};

export default api;