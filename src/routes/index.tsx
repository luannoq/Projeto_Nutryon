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

const AuthStack  = createNativeStackNavigator();
const AppStack   = createNativeStackNavigator();
const SetupStack = createNativeStackNavigator(); // NOVO! Navegador de perfil incompleto
const Tab        = createBottomTabNavigator();

// ─── ESTADO 1: Fluxo Não-autenticado (Visitante) ────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"      component={Login}      />
      <AuthStack.Screen name="Register"   component={Register}   />
      {/* 👻 O FANTASMA MORRE AQUI: Mudamos o nome da rota! */}
      <AuthStack.Screen name="AuthSetup"  component={Onboarding} /> 
    </AuthStack.Navigator>
  );
}

// ─── ESTADO 2: Fluxo Logado mas Incompleto (Preso no Onboarding) ────────────
function SetupNavigator() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  return (
    <SetupStack.Navigator screenOptions={{
      headerStyle: { backgroundColor: isDark ? '#0B1120' : '#FFFFFF' },
      headerTintColor: isDark ? '#F8FAFC' : '#0F172A',
      headerShadowVisible: false,
    }}>
      <SetupStack.Screen 
        name="Onboarding" 
        component={Onboarding} 
        options={{ headerTitle: 'Complete seu Perfil' }}
        // isUpdate=true garante que ao salvar, o app use a função updateUser() do contexto
        initialParams={{ isUpdate: true }} 
      />
    </SetupStack.Navigator>
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
            <Ionicons name={(icons[route.name] || 'ellipse-outline') as any} size={size} color={color} />
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

// ─── ESTADO 3: Fluxo Autenticado e Completo (App Liberado) ──────────────────
function AppNavigator() {
  const { themeMode, toggleTheme } = useTheme();
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

  return (
    <AppStack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle:       { backgroundColor: isDark ? '#0B1120' : '#FFFFFF' },
        headerTintColor:   isDark ? '#F8FAFC' : '#0F172A',
        headerShadowVisible: false,
        headerRight,
      }}
    >
      <AppStack.Screen name="MainTabs" component={TabNavigator} options={{ headerTitle: 'Nutryon' }} />
      {/* Mantemos o Onboarding aqui caso o usuário queira refazer pelo Perfil depois */}
      <AppStack.Screen name="Onboarding" component={Onboarding} options={{ headerTitle: 'Atualizar Metas', headerShown: true }} />
    </AppStack.Navigator>
  );
}

// ─── CONTROLE CENTRAL DE ESTADO ─────────────────────────────────────────────
export default function Routes() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0058bb" />
      </View>
    );
  }

  // Verifica se o usuário concluiu as metas (se tem um TDEE salvo)
  const hasCompletedOnboarding = !!user?.tdee;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        // 1. Não logou? Vai pro Auth (Login/Register)
        <AuthNavigator />
      ) : !hasCompletedOnboarding ? (
        // 2. Logou, mas parou no meio do cadastro? Fica preso no Setup
        <SetupNavigator />
      ) : (
        // 3. Logou e tem macros calculados? App liberado!
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}