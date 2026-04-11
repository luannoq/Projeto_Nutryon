import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem('nutryon_token');
        const userJson = await AsyncStorage.getItem('nutryon_user');

        if (token && userJson) {
          const user = JSON.parse(userJson) as User;
          setState({ token, user, isAuthenticated: true, isLoading: false });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    loadSession();
  }, []);

  const login = async (token: string, user: User) => {
    try {
      let finalUser = user;

      // ── MÁGICA DA RESTAURAÇÃO DO BACKUP ──
      // Se o usuário logando não tem TDEE (metas), tenta achar o backup salvo pelo email dele
      if (!finalUser.tdee && finalUser.email) {
        const backupJson = await AsyncStorage.getItem(`nutryon_backup_${finalUser.email}`);
        if (backupJson) {
          const backupUser = JSON.parse(backupJson);
          // Mescla os dados recebidos com os dados do backup
          finalUser = { ...finalUser, ...backupUser };
          console.log('[Auth] Backup do perfil restaurado com sucesso para:', finalUser.email);
        }
      }

      await AsyncStorage.setItem('nutryon_token', token);
      await AsyncStorage.setItem('nutryon_user', JSON.stringify(finalUser));
      
      // Cria ou Atualiza o backup permanente
      if (finalUser.email) {
        await AsyncStorage.setItem(`nutryon_backup_${finalUser.email}`, JSON.stringify(finalUser));
      }

      setState({ token, user: finalUser, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  };

  const logout = async () => {
    try {
      // Apaga apenas a sessão ativa, mantendo o backup intacto para o próximo login
      await AsyncStorage.removeItem('nutryon_token');
      await AsyncStorage.removeItem('nutryon_user');
      setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    }
  };

  const updateUser = async (user: User) => {
    try {
      await AsyncStorage.setItem('nutryon_user', JSON.stringify(user));
      
      // Atualiza também o backup permanente sempre que o usuário for atualizado
      if (user.email) {
        await AsyncStorage.setItem(`nutryon_backup_${user.email}`, JSON.stringify(user));
      }

      setState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};