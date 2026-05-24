import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configura como as notificações aparecem quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 12,
          minute: 0,
        },
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
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
      });
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
