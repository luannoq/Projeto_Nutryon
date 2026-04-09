import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useMeals } from '../hooks/useApi';
import { Meal } from '../types';

// Agrega refeições por dia — sem endpoint separado, usa os dados já carregados
const aggregateByDay = (meals: Meal[]) => {
  const map: Record<string, { date: string; totalKcal: number; count: number }> = {};

  meals.forEach((meal) => {
    const date = meal.timestamp
      ? new Date(meal.timestamp).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR');

    if (!map[date]) {
      map[date] = { date, totalKcal: 0, count: 0 };
    }
    map[date].totalKcal += meal.kcal || 0;
    map[date].count += 1;
  });

  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
};

export default function Reports() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const { data: meals, isLoading, isError, isFetching } = useMeals();

  const dailyReport = meals && meals.length > 0 ? aggregateByDay(meals) : [];
  const totalKcalGeral = dailyReport.reduce((acc, d) => acc + d.totalKcal, 0);
  const mediaKcal =
    dailyReport.length > 0 ? Math.round(totalKcalGeral / dailyReport.length) : 0;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? '#6C9FFF' : '#0058bb'} />
          <Text style={[styles.statusText, theme.textMuted]}>Carregando relatórios...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, theme.text]}>Não foi possível carregar os dados.</Text>
          <Text style={[styles.statusText, theme.textMuted]}>
            Verifique sua conexão com o servidor.
          </Text>
        </View>
      );
    }

    if (dailyReport.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.statusText, theme.textMuted]}>
            Nenhum dado suficiente para gerar relatório.{'\n'}
            Registre suas refeições para ver o histórico aqui.
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* Cards de resumo */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, theme.card]}>
            <Text style={[styles.summaryLabel, theme.textMuted]}>Dias registrados</Text>
            <Text style={[styles.summaryValue, theme.primaryText]}>{dailyReport.length}</Text>
          </View>
          <View style={[styles.summaryCard, theme.card]}>
            <Text style={[styles.summaryLabel, theme.textMuted]}>Média diária</Text>
            <Text style={[styles.summaryValue, theme.primaryText]}>{mediaKcal} kcal</Text>
          </View>
        </View>

        {/* Histórico por dia */}
        <View style={[styles.reportCard, theme.card]}>
          <Text style={[styles.reportTitle, theme.text]}>Histórico de Consumo</Text>

          {isFetching && !isLoading && (
            <ActivityIndicator
              size="small"
              color={isDark ? '#6C9FFF' : '#0058bb'}
              style={{ marginBottom: 12 }}
            />
          )}

          {dailyReport.map((day, index) => (
            <View
              key={day.date}
              style={[
                styles.reportRow,
                index < dailyReport.length - 1 && styles.reportRowBorder,
              ]}
            >
              <View>
                <Text style={[styles.rowDate, theme.text]}>{day.date}</Text>
                <Text style={[styles.rowCount, theme.textMuted]}>
                  {day.count} refeição{day.count !== 1 ? 'ões' : ''}
                </Text>
              </View>
              <Text style={[styles.rowKcal, theme.primaryText]}>
                {day.totalKcal} kcal
              </Text>
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, theme.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, theme.text]}>Relatórios</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  scrollContent: { padding: 24, flexGrow: 1, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  statusText: { marginTop: 8, fontSize: 15, textAlign: 'center', fontStyle: 'italic', lineHeight: 22 },
  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  summaryValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  reportCard: { padding: 24, borderRadius: 32 },
  reportTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  reportRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(148,163,184,0.3)' },
  rowDate: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  rowCount: { fontSize: 13 },
  rowKcal: { fontSize: 18, fontWeight: '900' },
});

const lightTheme = StyleSheet.create({
  container: { backgroundColor: '#F4F7FB' },
  text: { color: '#0F172A' },
  textMuted: { color: '#64748B' },
  primaryText: { color: '#0058bb' },
  card: { backgroundColor: '#FFFFFF', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 6 },
});

const darkTheme = StyleSheet.create({
  container: { backgroundColor: '#0B1120' },
  text: { color: '#F8FAFC' },
  textMuted: { color: '#94A3B8' },
  primaryText: { color: '#6C9FFF' },
  card: { backgroundColor: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 6 },
});
