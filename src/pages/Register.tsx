import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { userService } from '../services/api';

export default function Register() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Não usamos useAuth() aqui — login() só será chamado no final do Onboarding
  const navigation = useNavigation<any>();

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos para continuar.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Registra no Firebase — retorna token e user básico
      const response = await userService.register({ name, email, password });

      // NÃO chama login() aqui. O isAuthenticated continua false.
      // Passa token e user como parâmetro para o Onboarding terminar o fluxo.
      navigation.navigate('Onboarding', {
        tempToken: response.token,
        tempUser: { ...response.user, name },
      });
    } catch (err: any) {
      const msg = err.message || 'Erro desconhecido ao registrar.';
      setError(msg);
      console.log('🔴 Erro no Registro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, theme.container]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.logo, theme.primaryText]}>Nutryon</Text>
          <Text style={[styles.subtitle, theme.textMuted]}>Sua jornada híbrida começa aqui!</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, theme.text]}>Nome Completo</Text>
            <TextInput
              style={[styles.input, theme.input, theme.text]}
              value={name}
              onChangeText={setName}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              placeholder="Seu nome"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, theme.text]}>E-mail</Text>
            <TextInput
              style={[styles.input, theme.input, theme.text]}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              placeholder="seu@email.com"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, theme.text]}>Senha</Text>
            <TextInput
              style={[styles.input, theme.input, theme.text]}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              placeholder="Crie uma senha forte"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, theme.text]}>Confirmar Senha</Text>
            <TextInput
              style={[styles.input, theme.input, theme.text]}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              placeholder="Repita a senha"
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, theme.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
          <Text style={[styles.footerText, theme.textMuted]}>
            Já tem uma conta?{' '}
            <Text style={[theme.primaryText, { fontWeight: '800' }]}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS (Design do Clinical Curator mantido) ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 32, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 44, fontWeight: '900', marginBottom: 12, letterSpacing: -1.5 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', marginBottom: 10, marginLeft: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 18, fontSize: 16 },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  button: { paddingVertical: 20, borderRadius: 24, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 15, fontWeight: '500' },
});

const lightTheme = StyleSheet.create({
  container: { backgroundColor: '#F4F7FB' },
  text: { color: '#0F172A' },
  textMuted: { color: '#64748B' },
  primaryText: { color: '#0058bb' },
  input: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  button: { backgroundColor: '#0058bb' }
});

const darkTheme = StyleSheet.create({
  container: { backgroundColor: '#0B1120' },
  text: { color: '#F8FAFC' },
  textMuted: { color: '#94A3B8' },
  primaryText: { color: '#6C9FFF' },
  input: { backgroundColor: '#1E293B', borderColor: '#334155' },
  button: { backgroundColor: '#3853b7' }
});
