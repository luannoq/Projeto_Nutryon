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
      await AsyncStorage.setItem('nutryon_token', token);
      await AsyncStorage.setItem('nutryon_user', JSON.stringify(user));
      setState({ token, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  };

  const logout = async () => {
    try {
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
