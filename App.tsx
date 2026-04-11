import React, { useEffect } from 'react'; // <-- Adicione o useEffect aqui
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Importe o AsyncStorage
import Routes from './src/routes';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// ... outros imports que você tiver

const queryClient = new QueryClient();

export default function App() {
  // 🧹 MÁGICA DA LIMPEZA AQUI:
  useEffect(() => {
    AsyncStorage.clear().then(() => console.log('🧹 CACHE DESTRUÍDO COM SUCESSO!'));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Routes />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}