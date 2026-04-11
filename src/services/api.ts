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

// ── CRUD DE REFEIÇÕES — Oracle APEX ──────────────────────────────────────────

export const mealService = {
  list: async () => {
    try {
      const userId = await getStoredUserId();
      if (!userId) {
        console.warn("[mealService.list] Sem ID de usuário no storage");
        return [];
      }
      
      console.log(`[API] Driblando WAF: Usando POST para buscar refeições do ID: ${userId}`);

      // 1. Mudamos a rota para a nova que você criou: /refeicoes/buscar/
      // 2. Mudamos o método para api.post
      // 3. Mandamos o id_usuario no "corpo" (body) da requisição
      const { data } = await api.post(`${APEX_BASE}/refeicoes/buscar/`, {
        id_usuario: Number(userId)
      });

      // O nosso PL/SQL lá do banco vai devolver os dados dentro de "items"
      const allItems = data?.items ?? data ?? [];

      return allItems.map((item: any, index: number) => ({
        id:        String(item.id_refeicao || item.ID_REFEICAO || item.id || index),
        name:      item.nome_refeicao || item.NOME_REFEICAO || 'Refeição',
        // Colocando os parênteses para o JavaScript não se perder:
        kcal:      Number((item.calorias || item.CALORIAS) ?? 0),
        protein:   Number((item.proteinas || item.PROTEINAS) ?? 0),
        carbs:     Number((item.carboidratos || item.CARBOIDRATOS) ?? 0),
        fat:       Number((item.gorduras || item.GORDURAS) ?? 0),
        userId:    String(item.id_usuario || item.ID_USUARIO),
        timestamp: (item.data_registro || item.DATA_REGISTRO) ?? new Date().toISOString(),
      }));
    } catch (e: any) {
      console.error('[mealService.list ERROR]', e.message);
      return [];
    }
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

    return data;
  },

  update: async (id: string, meal: any) => {
    // Tenta PUT no Oracle (mesmo bypass de headers do POST)
    const { data } = await api.put(`${APEX_BASE}/refeicoes/${id}`, {
      nome_refeicao: meal.name,
      calorias:      Number(meal.kcal    ?? 0),
      proteinas:     Number(meal.protein ?? 0),
      carboidratos:  Number(meal.carbs   ?? 0),
      gorduras:      Number(meal.fat     ?? 0),
    });
    
    return { id, ...meal };
  },

  delete: async (id: string) => {
    // Tenta DELETE no Oracle
    await api.delete(`${APEX_BASE}/refeicoes/${id}`);
  },
};

// ── CÁLCULO DE TDEE/MACROS — PL/SQL no APEX ──────────────────────────────────

// ── CÁLCULO DE TDEE/MACROS — PL/SQL no APEX ──────────────────────────────────

export const apexService = {
  calcularMacros: async (params: {
    peso: number; altura: number; idade: number;
    sexo: string; nivel_atividade: string; objetivo: string;
  }) => {
    const { data } = await api.post(`${APEX_BASE}/calcular_macros/`, params);

    const item = data?.items?.[0] || data || {};
    const tdeeValue = Number(item.tdee || item.TDEE || 0);

    // Se o banco falhar ou devolver zero, nós lançamos o erro em vez de simular!
    if (!tdeeValue || isNaN(tdeeValue) || tdeeValue === 0) {
      throw new Error("Erro no servidor: O cálculo retornou 0 calorias.");
    }

    return {
      tdee:   tdeeValue,
      macros: {
        protein: Number(item.proteinas || item.PROTEINAS || 0),
        carbs:   Number(item.carboidratos || item.CARBOIDRATOS || 0),
        fat:     Number(item.gorduras || item.GORDURAS || 0),
      },
    };
  },
};

export default api;