# Instruções Sprint 4 — Nutryon Mobile
> Documento gerado para o Claude Code implementar as entregas da Sprint 4 (FIAP Challenge Oracle).
> Leia este documento inteiro antes de começar qualquer alteração.

---

## Visão Geral do Que Precisa Ser Feito

O projeto já está funcional (Sprint 3, nota 100). Precisamos adicionar:

1. **Notificações Locais** (`expo-notifications`) — PRIORIDADE MÁXIMA, -40 pts se faltar
2. **Tela "Sobre o App"** — obrigatória para publicação
3. **`eas.json`** — configuração de build para APK

**REGRA DE OURO: Não remover, renomear ou desativar nenhuma tela existente.**

---

## ⚠️ CORREÇÃO URGENTE — App.tsx

**Antes de qualquer coisa**, corrija este bug crítico no `App.tsx`:

O arquivo atual tem `AsyncStorage.clear()` no `useEffect`, que apaga TODOS os dados do usuário toda vez que o app abre. Isso é código de debug e precisa ser removido.

**Arquivo:** `App.tsx`

Substitua o conteúdo completo por:

```tsx
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
```

> **Por que criamos `AppContent` separado?** Porque `useNotifications` é um hook e precisa ser chamado dentro de um componente que está dentro dos Providers. O `App` em si é o provider raiz, então o hook vai dentro de um filho.

---

## 1. Instalar expo-notifications

Execute no terminal do projeto:

```bash
npx expo install expo-notifications
```

Isso instalará a versão compatível com o Expo SDK 54 automaticamente.

---

## 2. Atualizar `app.json`

**Arquivo:** `app.json`

Substitua o conteúdo completo por:

```json
{
  "expo": {
    "name": "Nutryon",
    "slug": "nutryon-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "plugins": [
      "expo-asset",
      [
        "expo-notifications",
        {
          "color": "#0058bb",
          "defaultChannel": "default",
          "sounds": []
        }
      ]
    ],
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#0058bb"
      },
      "permissions": [
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.POST_NOTIFICATIONS"
      ]
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "remote-notification"]
      }
    }
  }
}
```

> **Nota:** O ícone de notificação é opcional e foi omitido intencionalmente para evitar erros de build (o arquivo de imagem não existe no projeto).

---

## 3. CRIAR `src/hooks/useNotifications.ts`

**Arquivo novo:** `src/hooks/useNotifications.ts`

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configura como as notificações aparecem quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {

  /**
   * Solicita permissão de notificação ao usuário.
   * No Android 13+ (API 33+), é obrigatório pedir explicitamente.
   * Retorna true se a permissão foi concedida.
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      // Android: configura o canal de notificação (obrigatório para Android 8+)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Lembretes Nutryon',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0058bb',
          sound: 'default',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.warn('[useNotifications] Erro ao solicitar permissão:', error);
      return false;
    }
  };

  /**
   * Agenda lembretes diários de registro de refeições:
   * - 12:00 — lembrete do almoço
   * - 19:00 — lembrete do jantar
   * 
   * Cancela notificações existentes antes de agendar para evitar duplicatas.
   * Deve ser chamado após login e após finalizar o onboarding.
   */
  const scheduleDaily = async (): Promise<void> => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        console.warn('[useNotifications] Permissão negada — notificações não agendadas.');
        return;
      }

      // Cancela agendamentos anteriores para evitar duplicatas
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Lembrete das 12h
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🥗 Hora do almoço!',
          body: 'Não esqueça de registrar suas refeições hoje! 🥗',
          sound: 'default',
          data: { type: 'daily_reminder', time: '12h' },
        },
        trigger: {
          hour: 12,
          minute: 0,
          repeats: true,
        } as any,
      });

      // Lembrete das 19h
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍽️ Revisão do dia!',
          body: 'Não esqueça de registrar suas refeições hoje! 🥗',
          sound: 'default',
          data: { type: 'daily_reminder', time: '19h' },
        },
        trigger: {
          hour: 19,
          minute: 0,
          repeats: true,
        } as any,
      });

      console.log('[useNotifications] Lembretes diários agendados: 12h e 19h');
    } catch (error) {
      console.warn('[useNotifications] Erro ao agendar notificações diárias:', error);
    }
  };

  /**
   * Verifica se o usuário está a 90% ou mais da sua meta calórica.
   * Se sim, dispara uma notificação imediata de alerta.
   * 
   * @param consumed - kcal consumidas hoje
   * @param tdee - meta calórica diária (TDEE do usuário)
   * 
   * Deve ser chamado no Dashboard quando os dados de refeições carregarem.
   */
  const checkCalorieThreshold = async (
    consumed: number,
    tdee: number | null | undefined
  ): Promise<void> => {
    try {
      if (!tdee || tdee <= 0) return;
      if (consumed < tdee * 0.9) return;

      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚡ Atenção à sua meta!',
          body: 'Você está a 10% da sua meta calórica diária! ⚡',
          sound: 'default',
          data: { type: 'calorie_alert' },
        },
        trigger: null, // dispara imediatamente
      });

      console.log('[useNotifications] Alerta calórico disparado:', consumed, '/', tdee);
    } catch (error) {
      console.warn('[useNotifications] Erro ao verificar threshold calórico:', error);
    }
  };

  return { requestPermission, scheduleDaily, checkCalorieThreshold };
}
```

---

## 4. CRIAR `src/pages/AboutApp.tsx`

**Arquivo novo:** `src/pages/AboutApp.tsx`

> ⚠️ **ATENÇÃO:** Preencha os nomes e RMs reais do grupo na constante `TEAM_MEMBERS` abaixo antes de entregar!

```tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const APP_INFO = {
  name:       'Nutryon',
  version:    '1.0.0',
  commitHash: 'a3f7d21',   // hash do commit — altere se tiver o real
  description: 'Aplicativo de nutrição e controle de macronutrientes, desenvolvido como projeto acadêmico da FIAP (Challenge Oracle).',
};

const TEAM_MEMBERS = [
  { name: 'Renato Silva Alexandre Bezerra', rm: 'RM560928' },
  { name: 'Victor Rodrigues De Lima',       rm: 'RM560087' },
  { name: 'Luann Noqueli Klochko',          rm: 'RM560313' },
  { name: 'Lucas Higuti Fontanezi',         rm: 'RM561120' },
];

export default function AboutApp() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, theme.container]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Logo / Nome do App */}
        <View style={[styles.logoCard, theme.card]}>
          <Text style={[styles.appName, theme.primaryText]}>{APP_INFO.name}</Text>
          <Text style={[styles.appDescription, theme.textMuted]}>
            {APP_INFO.description}
          </Text>
        </View>

        {/* Informações Técnicas */}
        <View style={[styles.infoCard, theme.card]}>
          <Text style={[styles.sectionTitle, theme.textMuted]}>Informações do App</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme.textMuted]}>Versão</Text>
            <Text style={[styles.infoValue, theme.text]}>{APP_INFO.version}</Text>
          </View>

          <View style={[styles.divider, theme.divider]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme.textMuted]}>Commit</Text>
            <Text style={[styles.infoValue, theme.text, styles.mono]}>
              #{APP_INFO.commitHash}
            </Text>
          </View>

          <View style={[styles.divider, theme.divider]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme.textMuted]}>Plataforma</Text>
            <Text style={[styles.infoValue, theme.text]}>React Native + Expo SDK 54</Text>
          </View>

          <View style={[styles.divider, theme.divider]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme.textMuted]}>Backend</Text>
            <Text style={[styles.infoValue, theme.text]}>Oracle APEX (ORDS)</Text>
          </View>
        </View>

        {/* Integrantes do Grupo */}
        <View style={[styles.infoCard, theme.card]}>
          <Text style={[styles.sectionTitle, theme.textMuted]}>Equipe</Text>

          {TEAM_MEMBERS.map((member, index) => (
            <View key={index}>
              <View style={styles.memberRow}>
                <View style={[styles.memberAvatar, { backgroundColor: isDark ? 'rgba(108,159,255,0.15)' : 'rgba(0,88,187,0.1)' }]}>
                  <Text style={[styles.memberInitial, theme.primaryText]}>
                    {member.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, theme.text]}>{member.name}</Text>
                  <Text style={[styles.memberRM, theme.textMuted]}>{member.rm}</Text>
                </View>
              </View>
              {index < TEAM_MEMBERS.length - 1 && (
                <View style={[styles.divider, theme.divider]} />
              )}
            </View>
          ))}
        </View>

        {/* Rodapé */}
        <Text style={[styles.footer, theme.textMuted]}>
          FIAP — Challenge Oracle 2025{'\n'}
          Desenvolvido com ❤️ e muito café
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },

  logoCard: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },

  infoCard: {
    padding: 28,
    borderRadius: 32,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  mono: {
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '900',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  memberRM: {
    fontSize: 13,
    fontWeight: '500',
  },

  footer: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 8,
  },
});

const lightTheme = StyleSheet.create({
  container:  { backgroundColor: '#F4F7FB' },
  text:       { color: '#0F172A' },
  textMuted:  { color: '#64748B' },
  primaryText:{ color: '#0058bb' },
  card: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  divider: { backgroundColor: '#F1F5F9' },
});

const darkTheme = StyleSheet.create({
  container:  { backgroundColor: '#0B1120' },
  text:       { color: '#F8FAFC' },
  textMuted:  { color: '#94A3B8' },
  primaryText:{ color: '#6C9FFF' },
  card: {
    backgroundColor: '#1E293B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  divider: { backgroundColor: '#334155' },
});
```

---

## 5. ALTERAR `src/routes/index.tsx`

Adicionar a rota `AboutApp` dentro do `AppNavigator`. Fazer **apenas** as mudanças abaixo, sem tocar no resto do arquivo:

**Passo 5a — Adicionar import do AboutApp** (no topo do arquivo, junto aos outros imports de páginas):

```typescript
import AboutApp from '../pages/AboutApp';
```

**Passo 5b — Adicionar a rota dentro de `AppNavigator`**, logo após a rota `Onboarding` existente:

```tsx
<AppStack.Screen
  name="AboutApp"
  component={AboutApp}
  options={{ headerTitle: 'Sobre o App', headerShown: true }}
/>
```

O trecho final do `AppNavigator` deve ficar assim:

```tsx
<AppStack.Navigator
  initialRouteName="MainTabs"
  screenOptions={{ ... }}  // mantenha as screenOptions existentes sem alteração
>
  <AppStack.Screen name="MainTabs"   component={TabNavigator} options={{ headerTitle: 'Nutryon' }} />
  <AppStack.Screen name="Onboarding" component={Onboarding}  options={{ headerTitle: 'Atualizar Metas', headerShown: true }} />
  {/* NOVO — Sprint 4 */}
  <AppStack.Screen name="AboutApp"   component={AboutApp}    options={{ headerTitle: 'Sobre o App', headerShown: true }} />
</AppStack.Navigator>
```

---

## 6. ALTERAR `src/pages/Dashboard.tsx`

Adicionar o hook de notificações e o `useEffect` que verifica o threshold calórico.

**Passo 6a — Adicionar imports** no topo do arquivo (após os imports existentes):

```typescript
import { useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
```

> Atenção: o arquivo já importa `React` do topo. Modifique a linha de import do React para incluir `useEffect` e `useRef`:
> ```typescript
> import React, { useEffect, useRef } from 'react';
> ```

**Passo 6b — Adicionar o hook e a lógica de threshold** dentro do componente `Dashboard`, logo após as linhas que definem `consumed` e `remainingKcal`:

```typescript
const { checkCalorieThreshold } = useNotifications();

// useRef para não disparar o alerta mais de uma vez por sessão
const alertFired = useRef(false);

useEffect(() => {
  if (!mealsLoading && tdee && consumed.kcal > 0 && !alertFired.current) {
    if (consumed.kcal >= tdee * 0.9) {
      alertFired.current = true;
      checkCalorieThreshold(consumed.kcal, tdee);
    }
  }
}, [consumed.kcal, tdee, mealsLoading]);
```

> O `useRef(false)` garante que a notificação só dispara **uma vez por sessão** mesmo que o TanStack Query faça múltiplos refetches. Sem isso o usuário receberia várias notificações idênticas.

---

## 7. ALTERAR `src/pages/Onboarding.tsx`

Adicionar `scheduleDaily()` dentro do `handleFinish`, tanto no fluxo de cadastro novo quanto no de revisão.

**Passo 7a — Adicionar import** no topo do arquivo:

```typescript
import { useNotifications } from '../hooks/useNotifications';
```

**Passo 7b — Instanciar o hook** dentro do componente `Onboarding`, logo após as declarações de estado:

```typescript
const { scheduleDaily } = useNotifications();
```

**Passo 7c — Chamar `scheduleDaily()` no `handleFinish`**

Dentro de `handleFinish`, nos dois caminhos (isUpdate e novo cadastro), adicione a chamada **antes** da navegação/login. O resultado final do bloco `try` deve ficar assim:

```typescript
const handleFinish = async () => {
  setIsCalculating(true);
  try {
    const payload = { /* ... mantém igual */ };

    if (isUpdate) {
      await userService.syncProfileToOracle(payload);
      await updateUser({ /* ... mantém igual */ });

      // NOVO — Sprint 4: agenda notificações diárias após atualização
      await scheduleDaily();

      setStep(1);
      const navState = navigation.getState();
      if (navState && navState.routeNames.includes('MainTabs')) {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }

    } else {
      const oracleResponse = await userService.syncProfileToOracle(payload);
      const oracleId = String(oracleResponse?.id || oracleResponse?.id_usuario || tempUser.id || '1');

      const finalUser = { /* ... mantém igual */ };

      // NOVO — Sprint 4: agenda notificações diárias antes de liberar o app
      await scheduleDaily();

      setStep(1);
      await login(tempToken, finalUser);
    }
  } catch (err) {
    console.error('Erro ao finalizar Onboarding:', err);
  } finally {
    setIsCalculating(false);
  }
};
```

---

## 8. ALTERAR `src/pages/Login.tsx`

Adicionar `scheduleDaily()` após o login bem-sucedido.

**Passo 8a — Adicionar import** no topo:

```typescript
import { useNotifications } from '../hooks/useNotifications';
```

**Passo 8b — Instanciar o hook** dentro do componente `Login`:

```typescript
const { scheduleDaily } = useNotifications();
```

**Passo 8c — Chamar `scheduleDaily()`** no `handleSubmit`, logo após o `await login(...)`:

```typescript
// Dentro do bloco try de handleSubmit, após:
await login(response.token, { ...response.user, id: oracleUser.id });

// NOVO — Sprint 4
await scheduleDaily();
```

O bloco `try` completo do Login ficará assim:

```typescript
try {
  const response = await userService.login({ email, password }) as any;

  const storedJson = await import('@react-native-async-storage/async-storage')
    .then(m => m.default.getItem('nutryon_user'));
  const storedUser = storedJson ? JSON.parse(storedJson) : null;

  const oracleUser = await userService.syncProfileToOracle({
    nome:       response.user.name || storedUser?.name || 'Usuário',
    email:      response.user.email,
    senha_hash: 'firebase-auth',
    idade:      storedUser?.age    || 0,
    altura:     storedUser?.height || 0,
    peso:       storedUser?.weight || 0,
    objetivo:   storedUser?.goal   || null,
  }) as any;

  console.log("[LOGIN] ID Oracle recuperado:", oracleUser.id);

  await login(response.token, {
    ...response.user,
    id: oracleUser.id
  });

  // NOVO — Sprint 4: agenda lembretes diários após login
  await scheduleDaily();

} catch (err: any) {
  // ... mantém o catch igual
}
```

---

## 9. ALTERAR `src/pages/Profile.tsx`

Adicionar o botão "Sobre o App" e o botão "Refazer Onboarding".

**Passo 9a — Adicionar import de navegação** (já pode existir; se não existir, adicione):

```typescript
import { useNavigation } from '@react-navigation/native';
```

**Passo 9b — Instanciar a navegação** dentro do componente, junto aos outros hooks:

```typescript
const navigation = useNavigation<any>();
```

**Passo 9c — Adicionar os botões** no final do `ScrollView`, após o `goalContainer` existente. Adicione este bloco antes do fechamento do `</ScrollView>`:

```tsx
{/* Botões de navegação — Sprint 4 */}
<View style={styles.actionButtons}>
  <TouchableOpacity
    style={[styles.actionButton, theme.actionButtonSecondary]}
    onPress={() => navigation.navigate('Onboarding', { isUpdate: true })}
  >
    <Text style={[styles.actionButtonText, theme.primaryText]}>
      Refazer Onboarding
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.actionButton, theme.actionButtonSecondary]}
    onPress={() => navigation.navigate('AboutApp')}
  >
    <Text style={[styles.actionButtonText, theme.primaryText]}>
      Sobre o App
    </Text>
  </TouchableOpacity>
</View>
```

**Passo 9d — Adicionar os estilos** na constante `styles` (dentro do `StyleSheet.create` principal):

```typescript
actionButtons: {
  marginTop: 24,
  gap: 12,
},
actionButton: {
  paddingVertical: 18,
  borderRadius: 24,
  alignItems: 'center',
  borderWidth: 1.5,
},
actionButtonText: {
  fontSize: 15,
  fontWeight: '800',
  letterSpacing: 0.3,
},
```

**Passo 9e — Adicionar nos temas** (`lightTheme` e `darkTheme`):

```typescript
// Em lightTheme:
actionButtonSecondary: {
  backgroundColor: 'transparent',
  borderColor: '#0058bb',
},

// Em darkTheme:
actionButtonSecondary: {
  backgroundColor: 'transparent',
  borderColor: '#6C9FFF',
},
```

---

## 10. CRIAR `eas.json`

**Arquivo novo na raiz do projeto:** `eas.json`

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

> O profile `"preview"` é o que gera o APK para distribuição via Firebase App Distribution.
> Comando de build: `npx eas build --platform android --profile preview`

---

## Checklist Final (verificar antes de entregar)

- [ ] `expo-notifications` instalado (`npx expo install expo-notifications`)
- [ ] `App.tsx` sem o `AsyncStorage.clear()` (removido) e com `requestPermission` no useEffect
- [ ] `app.json` com plugin expo-notifications e permissões Android
- [ ] `src/hooks/useNotifications.ts` criado com os 3 métodos
- [ ] `src/pages/AboutApp.tsx` criado com dados do grupo preenchidos
- [ ] `src/routes/index.tsx` com import e rota `AboutApp` no AppNavigator
- [ ] `src/pages/Dashboard.tsx` com `checkCalorieThreshold` no useEffect
- [ ] `src/pages/Onboarding.tsx` com `scheduleDaily()` no `handleFinish`
- [ ] `src/pages/Login.tsx` com `scheduleDaily()` após login
- [ ] `src/pages/Profile.tsx` com botões "Sobre o App" e "Refazer Onboarding"
- [ ] `eas.json` criado na raiz
- [x] Dados do grupo preenchidos em `AboutApp.tsx` (nomes + RMs do README)
- [ ] App inicia e navega normalmente (nenhuma tela foi removida)

---

## Observações Importantes para o Claude Code

1. **NÃO altere** `src/services/api.ts`, `src/context/AuthContext.tsx`, `src/context/ThemeContext.tsx`, `src/hooks/useApi.ts`, `src/types.ts`. Esses arquivos funcionam e não fazem parte desta sprint.

2. **NÃO remova** nenhuma tela: Login, Register, Onboarding, Dashboard, MealLog, Reports, Profile — todas devem permanecer intactas.

3. **Mantenha** o padrão `lightTheme`/`darkTheme` em StyleSheet separado em qualquer tela que modificar.

4. **O trigger `{ hour, minute, repeats: true } as any`** é intencional. O expo-notifications SDK 54 mudou o tipo do trigger para `SchedulableTriggerInputTypes`, mas a API com `repeats` ainda funciona. O `as any` suprime o erro de TypeScript sem quebrar a funcionalidade.

5. **Sobre o `AsyncStorage.clear()`** no App.tsx: ele estava lá como código de debug da Sprint 3. É **crítico** removê-lo — sem isso, toda vez que o app abre ele apaga o usuário salvo e o app fica em loop de autenticação.
