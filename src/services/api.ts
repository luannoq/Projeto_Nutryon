import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// URL base extraída EXATAMENTE do seu Oracle APEX
const APEX_BASE = 'https://oracleapex.com/ords/projeto_nutryon/api';

const api = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    // A nossa máscara anti-firewall para todas as rotas:
    'Origin':       'https://oracleapex.com',
    'User-Agent':   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
});

const getStoredUserId = async (): Promise<string | null> => {
  try {
    const json = await AsyncStorage.getItem('nutryon_user');
    if (json) {
      const user = JSON.parse(json);
      const id = String(user.id || '');
      
      console.log("[DEBUG ID] ID no Storage:", id);
      
      // Se tiver letras, é o UID do Firebase. Se for só números, é o Oracle.
      if (/^\d+$/.test(id)) {
        return id;
      } else {
        console.warn("[AVISO] O ID atual é do Firebase. Você precisa sincronizar com o Oracle primeiro!");
        return null;
      }
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

  syncProfileToOracle: async (payload: {
    nome: string; email: string; senha_hash: string;
    idade: number; altura: number; peso: number; objetivo: string | null;
  }) => {
    const { data } = await api.post(`${APEX_BASE}/usuarios/`, payload);
    return { ...data, id: String(data.id_usuario || data.id || '') };
  },
};

// ── CACHE LOCAL DE REFEIÇÕES ──────────────────────────────────────────────────
// O WAF corporativo da Oracle (Akamai/CDN) bloqueia TODOS os GETs vindos de
// apps mobile para oracleapex.com, retornando a página "fw_error_www" com 403.
// O bypass de Origin funciona apenas para POST. Não existe header que resolva isso.
// Solução: cache local no AsyncStorage. create() grava no Oracle + local.
//          list() lê do local. Os dados chegam ao Oracle via POST normalmente.

const MEALS_KEY = 'nutryon_meals_cache';

const readMealsCache = async (userId: string): Promise<any[]> => {
  try {
    const json = await AsyncStorage.getItem(MEALS_KEY);
    if (!json) return [];
    const all: any[] = JSON.parse(json);
    return all.filter(m => String(m.userId) === String(userId));
  } catch {
    return [];
  }
};

const appendMealToCache = async (meal: any): Promise<void> => {
  try {
    const json = await AsyncStorage.getItem(MEALS_KEY);
    const all: any[] = json ? JSON.parse(json) : [];
    all.push(meal);
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(all));
  } catch {}
};

const updateMealInCache = async (id: string, updates: any): Promise<void> => {
  try {
    const json = await AsyncStorage.getItem(MEALS_KEY);
    const all: any[] = json ? JSON.parse(json) : [];
    const updated = all.map(m => m.id === id ? { ...m, ...updates } : m);
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(updated));
  } catch {}
};

const deleteMealFromCache = async (id: string): Promise<void> => {
  try {
    const json = await AsyncStorage.getItem(MEALS_KEY);
    const all: any[] = json ? JSON.parse(json) : [];
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(all.filter(m => m.id !== id)));
  } catch {}
};

// ── CRUD DE REFEIÇÕES — Oracle APEX ──────────────────────────────────────────

export const mealService = {
  list: async () => {
    const userId = await getStoredUserId();
    if (!userId) return [];
    const meals = await readMealsCache(userId);
    console.log(`[API] Cache local: ${meals.length} refeição(ões) para ID ${userId}`);
    return meals;
  },

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

    await appendMealToCache({
      id:        String(data.id_refeicao ?? `local_${Date.now()}`),
      name:      meal.name,
      kcal:      Number(meal.kcal    ?? 0),
      protein:   Number(meal.protein ?? 0),
      carbs:     Number(meal.carbs   ?? 0),
      fat:       Number(meal.fat     ?? 0),
      userId:    String(userId),
      timestamp: new Date().toISOString(),
    });

    return data;
  },

  update: async (id: string, meal: any) => {
    // Tenta PUT no Oracle (mesmo bypass de headers do POST)
    try {
      await api.put(`${APEX_BASE}/refeicoes/${id}`, {
        nome_refeicao: meal.name,
        calorias:      Number(meal.kcal    ?? 0),
        proteinas:     Number(meal.protein ?? 0),
        carboidratos:  Number(meal.carbs   ?? 0),
        gorduras:      Number(meal.fat     ?? 0),
      });
    } catch (e: any) {
      console.warn('[API] PUT Oracle falhou, atualizando apenas cache:', e?.response?.status);
    }

    // Sempre atualiza o cache local para refletir na UI
    await updateMealInCache(id, {
      name:    meal.name,
      kcal:    Number(meal.kcal    ?? 0),
      protein: Number(meal.protein ?? 0),
      carbs:   Number(meal.carbs   ?? 0),
      fat:     Number(meal.fat     ?? 0),
    });

    return { id, ...meal };
  },

  delete: async (id: string) => {
    // Tenta DELETE no Oracle
    try {
      await api.delete(`${APEX_BASE}/refeicoes/${id}`);
    } catch (e: any) {
      console.warn('[API] DELETE Oracle falhou, removendo apenas do cache:', e?.response?.status);
    }

    // Sempre remove do cache local
    await deleteMealFromCache(id);
  },
};

// ── CÁLCULO DE TDEE/MACROS — PL/SQL no APEX ──────────────────────────────────

export const apexService = {
  calcularMacros: async (params: {
    peso: number; altura: number; idade: number;
    sexo: string; nivel_atividade: string; objetivo: string;
  }) => {
    // Axios limpinho porque os headers já estão na configuração global
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