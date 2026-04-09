import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';

export default function Login() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigation = useNavigation<any>();

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Chama userService.login — retorna mock agora, APEX depois
      const response = await userService.login({ email, password });
      await login(response.token, response.user);
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, theme.container]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.logo, theme.primaryText]}>Nutryon</Text>
          <Text style={[styles.subtitle, theme.textMuted]}>
            Bem-vindo de volta! Entre na sua conta.
          </Text>
        </View>

        <View style={styles.form}>
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
              placeholder="Sua senha"
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
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.footer}
        >
          <Text style={[styles.footerText, theme.textMuted]}>
            Não tem uma conta?{' '}
            <Text style={theme.primaryText}>Registre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 32, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 44, fontWeight: '900', marginBottom: 10, letterSpacing: -1 },
  subtitle: { fontSize: 16, textAlign: 'center', fontWeight: '500' },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 15 },
});

const lightTheme = StyleSheet.create({
  container: { backgroundColor: '#F4F7FB' },
  text: { color: '#0F172A' },
  textMuted: { color: '#64748B' },
  primaryText: { color: '#0058bb' },
  input: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  button: { backgroundColor: '#0058bb' },
});

const darkTheme = StyleSheet.create({
  container: { backgroundColor: '#0B1120' },
  text: { color: '#F8FAFC' },
  textMuted: { color: '#94A3B8' },
  primaryText: { color: '#6C9FFF' },
  input: { backgroundColor: '#1E293B', borderColor: '#334155' },
  button: { backgroundColor: '#3853b7' },
});
