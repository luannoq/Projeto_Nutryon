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
