import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useUpdateProfile } from '../hooks/useApi';

export default function Profile() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const { user, logout, updateUser } = useAuth();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || ''
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isSaved) {
      const timer = setTimeout(() => setIsSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
      };
      const updatedUser = await updateProfile.mutateAsync(payload);
      
      await updateUser({ ...user, ...updatedUser } as any);
      setIsSaved(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout(); // Calls async storage cleanup internally
  };

  return (
    <SafeAreaView style={[styles.container, theme.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, theme.text]}>Perfil</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.avatarContainer, theme.card]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(108, 159, 255, 0.15)' : 'rgba(0, 88, 187, 0.1)' }]}>
             <Text style={[styles.avatarInitials, theme.primaryText]}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={[styles.userName, theme.text]}>{user?.name}</Text>
          <Text style={[styles.userEmail, theme.textMuted]}>{user?.email}</Text>
        </View>

        <View style={[styles.formContainer, theme.card]}>
           <Text style={[styles.sectionTitle, theme.text]}>Informações Pessoais</Text>

           <View style={styles.inputGroup}>
             <Text style={[styles.label, theme.text]}>Nome</Text>
             <TextInput 
               style={[styles.input, theme.input, theme.text]}
               value={formData.name}
               onChangeText={(t) => setFormData(prev => ({...prev, name: t}))}
               placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
             />
           </View>

           <View style={styles.rowInputs}>
             <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
               <Text style={[styles.label, theme.text]}>Idade</Text>
               <TextInput 
                 style={[styles.input, theme.input, theme.text]}
                 keyboardType="numeric"
                 value={formData.age}
                 onChangeText={(t) => setFormData(prev => ({...prev, age: t}))}
                 placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
               />
             </View>

             <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
               <Text style={[styles.label, theme.text]}>Altura (cm)</Text>
               <TextInput 
                 style={[styles.input, theme.input, theme.text]}
                 keyboardType="numeric"
                 value={formData.height}
                 onChangeText={(t) => setFormData(prev => ({...prev, height: t}))}
                 placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
               />
             </View>

             <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
               <Text style={[styles.label, theme.text]}>Peso (kg)</Text>
               <TextInput 
                 style={[styles.input, theme.input, theme.text]}
                 keyboardType="numeric"
                 value={formData.weight}
                 onChangeText={(t) => setFormData(prev => ({...prev, weight: t}))}
                 placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
               />
             </View>
           </View>

           <TouchableOpacity 
             style={[
               styles.saveButton, 
               theme.button, 
               isSaved && styles.saveButtonSuccess,
               updateProfile.isPending && styles.buttonDisabled
             ]} 
             onPress={handleSubmit}
             disabled={updateProfile.isPending}
           >
             {updateProfile.isPending ? (
               <ActivityIndicator color="#fff" />
             ) : (
               <Text style={styles.saveButtonText}>
                 {isSaved ? 'Salvo com sucesso!' : 'Salvar Alterações'}
               </Text>
             )}
           </TouchableOpacity>
        </View>

        <View style={styles.goalContainer}>
          <Text style={[styles.goalTitle, theme.textMuted]}>Objetivo Atual:</Text>
          <Text style={[styles.goalValue, theme.primaryText]}>
            {user?.goal === 'lose' ? 'Perder Peso' : user?.goal === 'gain' ? 'Ganhar Peso' : 'Manter Peso'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 24, 
    paddingBottom: 16 
  },
  title: { 
    fontSize: 36, 
    fontWeight: '900',
    letterSpacing: -1
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  logoutText: { 
    color: '#EF4444', 
    fontWeight: '800',
    letterSpacing: 0.5
  },
  scrollContent: { 
    padding: 24, 
    flexGrow: 1,
    paddingBottom: 40
  },
  avatarContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 32,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitials: { 
    fontSize: 36, 
    fontWeight: '900' 
  },
  userName: { 
    fontSize: 28, 
    fontWeight: '900', 
    marginBottom: 4,
    letterSpacing: -0.5
  },
  userEmail: { 
    fontSize: 15,
    fontWeight: '500'
  },
  formContainer: {
    padding: 28,
    borderRadius: 32,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    marginBottom: 24,
    letterSpacing: -0.5
  },
  inputGroup: { 
    marginBottom: 20 
  },
  rowInputs: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  label: { 
    fontSize: 11, 
    fontWeight: '800', 
    marginBottom: 10, 
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  input: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
  },
  saveButton: {
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonSuccess: { 
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  saveButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '800',
    letterSpacing: 0.5
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  goalContainer: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  goalTitle: { 
    fontSize: 16,
    fontWeight: '600'
  },
  goalValue: { 
    fontSize: 18, 
    fontWeight: '900',
    letterSpacing: -0.5
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
  input: { 
    backgroundColor: '#FFFFFF', 
    borderColor: '#E2E8F0',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    backgroundColor: '#0058bb',
    shadowColor: '#0058bb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  }
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
  input: { 
    backgroundColor: '#0F172A', 
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    backgroundColor: '#3853b7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  }
});