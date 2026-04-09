import React from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Login      from '../pages/Login';
import Register   from '../pages/Register';
import Onboarding from '../pages/Onboarding';
import Dashboard  from '../pages/Dashboard';
import MealLog    from '../pages/MealLog';
import Reports    from '../pages/Reports';
import Profile    from '../pages/Profile';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AuthStack = createNativeStackNavigator();
const AppStack  = createNativeStackNavigator();
const Tab       = createBottomTabNavigator();

// ─── Fluxo não-autenticado: Login → Register → Onboarding ───────────────────
// O Onboarding fica aqui para usuários novos. O login() só é chamado no
// passo 7 do Onboarding, então isAuthenticated ainda é false nesse stack.
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"      component={Login}      />
      <AuthStack.Screen name="Register"   component={Register}   />
      <AuthStack.Screen name="Onboarding" component={Onboarding} />
    </AuthStack.Navigator>
  );
}

function TabNavigator() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#0058bb',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopColor:  isDark ? '#334151' : '#E5E7EB',
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Dashboard: 'home-outline',
            MealLog:   'restaurant-outline',
            Reports:   'bar-chart-outline',
            Profile:   'person-outline',
          };
          return (
            <Ionicons
              name={(icons[route.name] || 'ellipse-outline') as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} options={{ title: 'Início'     }} />
      <Tab.Screen name="MealLog"   component={MealLog}   options={{ title: 'Diário'     }} />
      <Tab.Screen name="Reports"   component={Reports}   options={{ title: 'Relatórios' }} />
      <Tab.Screen name="Profile"   component={Profile}   options={{ title: 'Perfil'     }} />
    </Tab.Navigator>
  );
}

// ─── Fluxo autenticado: MainTabs + Onboarding de revisão ────────────────────
// O Onboarding também está aqui para que usuários logados possam refazer as
// metas pelo Profile sem causar crash de rota não encontrada.
function AppNavigator() {
  const { themeMode, toggleTheme } = useTheme();
  const { user } = useAuth(); // Adicione isso para ler o usuário logado
  const isDark = themeMode === 'dark';

  const headerRight = () => (
    <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 16 }}>
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={22}
        color={isDark ? '#F8FAFC' : '#0F172A'}
      />
    </TouchableOpacity>
  );

  // Verifica se o usuário tem a meta calculada
  const hasMacros = !!user?.tdee;

  return (
    <AppStack.Navigator
      // Se não tem macro, a rota inicial é OBRIGATORIAMENTE o Onboarding
      initialRouteName={hasMacros ? 'MainTabs' : 'Onboarding'}
      screenOptions={{
        headerStyle:       { backgroundColor: isDark ? '#0B1120' : '#FFFFFF' },
        headerTintColor:   isDark ? '#F8FAFC' : '#0F172A',
        headerShadowVisible: false,
        headerRight,
      }}
    >
      <AppStack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerTitle: 'Nutryon' }}
      />
      <AppStack.Screen
        name="Onboarding"
        component={Onboarding}
        options={{ headerTitle: 'Configuração Inicial', headerShown: true }}
        // Passa o parâmetro isUpdate como true se ele já estiver logado
        initialParams={{ isUpdate: true }}
      />
    </AppStack.Navigator>
  );
}

export default function Routes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0058bb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
