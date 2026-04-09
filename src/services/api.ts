import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const API_BASE_URL = 'https://oracleapex.com/ords/projeto_nutryon';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// ─── Helper: ID do usuário logado (vindo do AsyncStorage) ────────────────────
const getStoredUserId = async (): Promise<string> => {
  try {
    const userJson = await AsyncStorage.getItem('nutryon_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return String(user.id || '1');
    }
  } catch { /* silencia erros de parse */ }
  return '1';
};

// ─── SERVIÇOS DE USUÁRIO ─────────────────────────────────────────────────────

export const userService = {
  getProfile: async () => ({ id: '1', name: 'Usuário', email: '', goal: 'maintain' }),
  updateProfile: async (user: any) => user,

  // Firebase Auth — cria conta, retorna token + uid real
  register: async (user: any) => {
    try {
      console.log('🚀 Registrando no Firebase...');
      const credential   = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const firebaseToken = await credential.user.getIdToken();
      return {
        token: firebaseToken,
        user:  { id: credential.user.uid, name: user.name, email: user.email },
      };
    } catch (error: any) {
      console.error('❌ Erro no Register:', error.message);
      throw error;
    }
  },

  // Firebase Auth — autentica e retorna token
  login: async (credentials: any) => {
    try {
      console.log('🚀 Autenticando no Firebase...');
      const credential    = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const firebaseToken  = await credential.user.getIdToken();
      return {
        token: firebaseToken,
        user:  { id: credential.user.uid, name: 'Usuário', email: credentials.email },
      };
    } catch (error: any) {
      console.error('❌ Erro no Login:', error.message);
      throw error;
    }
  },

  // Oracle APEX — grava/atualiza perfil e retorna ID da PK (TBL_USUARIOS)
  syncProfileToOracle: async (payload: any) => {
    try {
      console.log('🚀 Sincronizando perfil com Oracle APEX...');
      const response = await fetch(`${API_BASE_URL}/api/usuarios/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Oracle rejeitou com status: ${response.status}`);
      }

      const data = await response.json();
      // Normaliza — o APEX pode devolver id ou id_usuario
      return { ...data, id: String(data.id || data.id_usuario || '') };
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar com Oracle:', error.message);
      throw error;
    }
  },
};

// ─── SERVIÇOS DE REFEIÇÃO (CRUD — TBL_REFEICOES) ─────────────────────────────

export const mealService = {

  // GET filtrado pelo id_usuario — cada usuário vê só as próprias refeições
  list: async () => {
    try {
      const userId = await getStoredUserId();
      const { data } = await api.get(`/refeicoes/?id_usuario=${userId}`);
      return (data?.items ?? []).map((item: any) => ({
        id:        String(item.id_refeicao),
        name:      item.nome_refeicao,
        kcal:      Number(item.calorias),
        protein:   Number(item.proteinas    || 0),
        carbs:     Number(item.carboidratos || 0),
        fat:       Number(item.gorduras     || 0),
        userId:    String(item.id_usuario),
        timestamp: item.data_registro || new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Erro ao listar refeições:', e);
      return [];
    }
  },

  // POST com todos os macros — calorias + proteína + carbos + gordura
  create: async (meal: any) => {
    const userId = await getStoredUserId();
    const payload = {
      id_usuario:    Number(userId),
      nome_refeicao: meal.name,
      calorias:      Number(meal.kcal     || 0),
      proteinas:     Number(meal.protein  || 0),
      carboidratos:  Number(meal.carbs    || 0),
      gorduras:      Number(meal.fat      || 0),
    };
    const { data } = await api.post('/refeicoes/', payload);
    return data;
  },

  // PUT com todos os macros
  update: async (id: string, meal: any) => {
    const payload = {
      nome_refeicao: meal.name,
      calorias:      Number(meal.kcal    || 0),
      proteinas:     Number(meal.protein || 0),
      carboidratos:  Number(meal.carbs   || 0),
      gorduras:      Number(meal.fat     || 0),
    };
    const { data } = await api.put(`/refeicoes/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/refeicoes/${id}`);
  },
};

// ─── SERVIÇO APEX — Cálculo de TDEE/Macros (PL/SQL fn_calcular_tdee) ─────────

export const apexService = {
  calcularMacros: async (params: {
    peso:            number;
    altura:          number;
    idade:           number;
    sexo:            string;
    nivel_atividade: string;
    objetivo:        string;
  }) => {
    const { data } = await api.post('/calcular_macros/', params);
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
