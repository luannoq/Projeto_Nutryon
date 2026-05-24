import React, { useEffect } from 'react';
import Routes from './src/routes';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from './src/hooks/useNotifications';

const queryClient = new QueryClient();

function AppContent() {
  const { requestPermission } = useNotifications();

  useEffect(() => {
    // Solicita permissão de notificação na inicialização do app
    requestPermission();
  }, []);

  return <Routes />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
