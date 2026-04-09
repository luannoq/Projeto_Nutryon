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
import { useAuth } from '../context/AuthContext';
import { useMeals } from '../hooks/useApi';

export default function Dashboard() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const { user }                          = useAuth();
  const { data: meals, isLoading: mealsLoading } = useMeals();

  // Metas vindas do Oracle APEX via Onboarding — sem fallback hardcoded
  const tdee   = user?.tdee   ?? null;
  const macros = user?.macros ?? null;

  // ── Totais consumidos calculados a partir das refeições do dia ─────────────
  const consumed = Array.isArray(meals)
    ? meals.reduce(
        (acc, meal) => ({
          kcal:    acc.kcal    + (meal.kcal    || 0),
          protein: acc.protein + (meal.protein || 0),
          carbs:   acc.carbs   + (meal.carbs   || 0),
          fat:     acc.fat     + (meal.fat     || 0),
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const remainingKcal = tdee != null ? Math.max(tdee - consumed.kcal, 0) : null;

  // Helper para exibir "consumido / meta" nos cards de macro
  const macroLabel = (consumed: number, goal: number | undefined) =>
    goal != null ? `${consumed}g / ${goal}g` : `${consumed}g`;

  return (
    <SafeAreaView style={[styles.container, theme.container]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <Text style={[styles.greeting, theme.textMuted]}>Olá,</Text>
          <Text style={[styles.name, theme.text]}>{user?.name || 'Usuário'}</Text>
        </View>

        {/* ── Card de meta calórica ── */}
        <View style={[styles.card, theme.card]}>
          <Text style={[styles.cardTitle, theme.textMuted]}>Meta Calórica Diária</Text>
          <Text style={[styles.calorieValue, theme.primaryText]}>
            {tdee != null
              ? <>{tdee} <Text style={[styles.kcalLabel, theme.textMuted]}>kcal</Text></>
              : <Text style={[styles.kcalLabel, theme.textMuted]}>Complete o Onboarding</Text>
            }
          </Text>
          <Text style={[styles.cardSubtitle, theme.textMuted]}>
            Calculado via Oracle APEX
          </Text>
        </View>

        {/* ── Cards de macros: meta + consumido ── */}
        <View style={styles.macrosRow}>
          {macros ? (
            [
              { label: 'Proteínas',    consumed: consumed.protein, goal: macros.protein },
              { label: 'Carboidratos', consumed: consumed.carbs,   goal: macros.carbs   },
              { label: 'Gorduras',     consumed: consumed.fat,     goal: macros.fat     },
            ].map((m) => (
              <View key={m.label} style={[styles.macroCard, theme.card]}>
                <Text style={[styles.macroLabel, theme.textMuted]}>{m.label}</Text>
                <Text style={[styles.macroValue, theme.text]}>
                  {macroLabel(m.consumed, m.goal)}
                </Text>
              </View>
            ))
          ) : (
            <View style={[styles.card, theme.card, { flex: 1 }]}>
              <Text style={[styles.cardSubtitle, theme.textMuted]}>
                Macros disponíveis após o Onboarding.
              </Text>
            </View>
          )}
        </View>

        {/* ── Resumo do dia ── */}
        <View style={[styles.card, theme.card]}>
          <Text style={[styles.cardTitle, theme.textMuted]}>Resumo de Hoje</Text>
          {mealsLoading ? (
            <ActivityIndicator color={isDark ? '#6C9FFF' : '#0058bb'} style={{ marginTop: 16 }} />
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, theme.textMuted]}>Consumido</Text>
                <Text style={[styles.summaryValue, theme.primaryText]}>
                  {consumed.kcal} kcal
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, theme.textMuted]}>Restante</Text>
                <Text style={[styles.summaryValue, theme.text]}>
                  {remainingKcal != null ? `${remainingKcal} kcal` : '---'}
                </Text>
              </View>
              {(!meals || meals.length === 0) && (
                <Text style={[styles.emptyText, theme.textMuted]}>
                  Nenhuma refeição registrada ainda.
                </Text>
              )}
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollContent: { 
    padding: 24, 
    flexGrow: 1,
    paddingBottom: 40
  },
  header: { 
    marginBottom: 32, 
    marginTop: 16 
  },
  greeting: { 
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  name: { 
    fontSize: 36, 
    fontWeight: '900',
    letterSpacing: -1
  },
  card: {
    padding: 28,
    borderRadius: 32,
    marginBottom: 20,
  },
  cardTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    marginBottom: 12, 
    letterSpacing: 1.2 
  },
  calorieValue: { 
    fontSize: 56, 
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 64
  },
  kcalLabel: { 
    fontSize: 20, 
    fontWeight: '600',
    letterSpacing: 0
  },
  cardSubtitle: { 
    fontSize: 13, 
    marginTop: 8,
    fontWeight: '500'
  },
  macrosRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 20 
  },
  macroCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  macroLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: 'center'
  },
  macroValue: { 
    fontSize: 22, 
    fontWeight: '900',
    letterSpacing: -0.5
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 16,
    alignItems: 'center'
  },
  summaryLabel: { 
    fontSize: 16,
    fontWeight: '600'
  },
  summaryValue: { 
    fontSize: 18, 
    fontWeight: '800' 
  },
  emptyText: { 
    marginTop: 24, 
    fontStyle: 'italic', 
    fontSize: 15,
    textAlign: 'center'
  },
});

const lightTheme = StyleSheet.create({
  container: { 
    backgroundColor: '#F4F7FB' 
  },
  text: { 
    color: '#0F172A' 
  },
  textMuted: { 
    color: '#64748B' 
  },
  primaryText: { 
    color: '#0058bb' 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
});

const darkTheme = StyleSheet.create({
  container: { 
    backgroundColor: '#0B1120' 
  },
  text: { 
    color: '#F8FAFC' 
  },
  textMuted: { 
    color: '#94A3B8' 
  },
  primaryText: { 
    color: '#6C9FFF' 
  },
  card: { 
    backgroundColor: '#1E293B', 
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
});