import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useMeals, useCreateMeal, useUpdateMeal, useDeleteMeal } from '../hooks/useApi';
import { Meal } from '../types';

// Estado do formulário do modal
interface MealForm {
  name:    string;
  kcal:    string;
  protein: string;
  carbs:   string;
  fat:     string;
}

const EMPTY_FORM: MealForm = { name: '', kcal: '', protein: '', carbs: '', fat: '' };

export default function MealLog() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const { data: meals, isLoading, isError, isFetching } = useMeals();
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeal, setEditingMeal]   = useState<Meal | null>(null);
  const [form, setForm]                 = useState<MealForm>(EMPTY_FORM);

  const setField = (key: keyof MealForm, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const openCreateModal = () => {
    setEditingMeal(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (meal: Meal) => {
    setEditingMeal(meal);
    setForm({
      name:    meal.name,
      kcal:    String(meal.kcal),
      protein: String(meal.protein || 0),
      carbs:   String(meal.carbs   || 0),
      fat:     String(meal.fat     || 0),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.kcal.trim()) return;

    const payload = {
      name:    form.name.trim(),
      kcal:    parseInt(form.kcal)    || 0,
      protein: parseInt(form.protein) || 0,
      carbs:   parseInt(form.carbs)   || 0,
      fat:     parseInt(form.fat)     || 0,
    };

    try {
      if (editingMeal) {
        await updateMeal.mutateAsync({ id: editingMeal.id, meal: payload });
      } else {
        await createMeal.mutateAsync(payload);
      }
      setModalVisible(false);
      setEditingMeal(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a refeição. Tente novamente.');
      console.error('Erro ao salvar refeição:', e);
    }
  };

  const handleDelete = (meal: Meal) => {
    Alert.alert(
      'Excluir refeição',
      `Deseja excluir "${meal.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeal.mutateAsync(meal.id);
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir a refeição.');
              console.error('Erro ao excluir refeição:', e);
            }
          },
        },
      ]
    );
  };

  const isSaving = createMeal.isPending || updateMeal.isPending;

  const renderMeal = ({ item }: { item: Meal }) => (
    <View style={[styles.mealCard, theme.card]}>
      <View style={styles.mealInfo}>
        <Text style={[styles.mealName, theme.text]}>{item.name}</Text>
        <Text style={[styles.mealCalories, theme.primaryText]}>{item.kcal} kcal</Text>
      </View>
      {/* Macros da refeição em linha */}
      {(item.protein > 0 || item.carbs > 0 || item.fat > 0) && (
        <View style={styles.mealMacrosRow}>
          <Text style={[styles.mealMacroText, theme.textMuted]}>P {item.protein}g</Text>
          <Text style={[styles.mealMacroText, theme.textMuted]}>C {item.carbs}g</Text>
          <Text style={[styles.mealMacroText, theme.textMuted]}>G {item.fat}g</Text>
        </View>
      )}
      <View style={styles.mealActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(108,159,255,0.15)' : 'rgba(0,88,187,0.1)' }]}
          onPress={() => openEditModal(item)}
        >
          <Text style={[styles.editBtnText, theme.primaryText]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
          disabled={deleteMeal.isPending}
        >
          {deleteMeal.isPending && deleteMeal.variables === item.id ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={styles.deleteBtnText}>Excluir</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? '#6C9FFF' : '#0058bb'} />
          <Text style={[styles.statusText, theme.textMuted]}>Carregando refeições...</Text>
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, theme.text]}>Não foi possível carregar as refeições.</Text>
          <Text style={[styles.statusText, theme.textMuted]}>Verifique a conexão com o servidor.</Text>
        </View>
      );
    }
    if (!meals || meals.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.statusText, theme.textMuted]}>Nenhuma refeição registrada hoje.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        renderItem={renderMeal}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          isFetching && !isLoading
            ? <ActivityIndicator size="small" color={isDark ? '#6C9FFF' : '#0058bb'} style={{ marginBottom: 12 }} />
            : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, theme.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, theme.text]}>Diário</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: isDark ? 'rgba(108,159,255,0.15)' : 'rgba(0,88,187,0.1)' }]}
          onPress={openCreateModal}
        >
          <Text style={[styles.addButtonText, theme.primaryText]}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(15,23,42,0.4)' }]}>
          <View style={[styles.modalContent, theme.card]}>
            <Text style={[styles.modalTitle, theme.text]}>
              {editingMeal ? 'Editar Refeição' : 'Nova Refeição'}
            </Text>

            {/* ScrollView interno para o modal não cortar campos em telas pequenas */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={[styles.input, theme.input, theme.text]}
                placeholder="Nome (ex: Almoço)"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={form.name}
                onChangeText={(v) => setField('name', v)}
              />
              <TextInput
                style={[styles.input, theme.input, theme.text, { marginTop: 12 }]}
                placeholder="Calorias (kcal)"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                keyboardType="numeric"
                value={form.kcal}
                onChangeText={(v) => setField('kcal', v)}
              />

              {/* Linha de macros */}
              <View style={styles.macroInputRow}>
                <View style={styles.macroInputGroup}>
                  <Text style={[styles.macroInputLabel, theme.textMuted]}>Proteína (g)</Text>
                  <TextInput
                    style={[styles.inputMacro, theme.input, theme.text]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="numeric"
                    value={form.protein}
                    onChangeText={(v) => setField('protein', v)}
                  />
                </View>
                <View style={styles.macroInputGroup}>
                  <Text style={[styles.macroInputLabel, theme.textMuted]}>Carbos (g)</Text>
                  <TextInput
                    style={[styles.inputMacro, theme.input, theme.text]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="numeric"
                    value={form.carbs}
                    onChangeText={(v) => setField('carbs', v)}
                  />
                </View>
                <View style={styles.macroInputGroup}>
                  <Text style={[styles.macroInputLabel, theme.textMuted]}>Gordura (g)</Text>
                  <TextInput
                    style={[styles.inputMacro, theme.input, theme.text]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="numeric"
                    value={form.fat}
                    onChangeText={(v) => setField('fat', v)}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, theme.button, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>{editingMeal ? 'Atualizar' : 'Salvar'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  addButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  addButtonText: { fontWeight: '800', letterSpacing: 0.5 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  statusText: { marginTop: 8, fontStyle: 'italic', fontSize: 15, textAlign: 'center', fontWeight: '500' },
  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorText: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  listContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  mealCard: { padding: 24, borderRadius: 24, marginBottom: 16 },
  mealInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealName: { fontSize: 20, fontWeight: '800', flex: 1, letterSpacing: -0.5 },
  mealCalories: { fontSize: 18, fontWeight: '900' },
  mealActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  actionBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  editBtnText: { fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.1)' },
  deleteBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: 48 },
  modalTitle: { fontSize: 28, fontWeight: '900', marginBottom: 24, letterSpacing: -0.5 },
  input: { borderWidth: 1, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 18, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 32, gap: 12 },
  cancelBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  cancelBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 16 },
  saveBtn: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 24, justifyContent: 'center' },
  saveBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  buttonDisabled: { opacity: 0.6 },
});

// ─── Estilos adicionados para os campos de macros no modal ──────────────────
// (inseridos separadamente para não alterar o StyleSheet original)
Object.assign(styles, StyleSheet.create({
  mealMacrosRow:    { flexDirection: 'row', gap: 16, marginBottom: 12 },
  mealMacroText:    { fontSize: 13, fontWeight: '700' },
  macroInputRow:    { flexDirection: 'row', gap: 10, marginTop: 12 },
  macroInputGroup:  { flex: 1 },
  macroInputLabel:  { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.8 },
  inputMacro:       { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 14, fontSize: 15, textAlign: 'center' },
  errorTitle:       { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
}));

const lightTheme = StyleSheet.create({
  container: { backgroundColor: '#F4F7FB' },
  text: { color: '#0F172A' },
  textMuted: { color: '#64748B' },
  primaryText: { color: '#0058bb' },
  card: { backgroundColor: '#FFFFFF', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  button: { backgroundColor: '#0058bb' },
});

const darkTheme = StyleSheet.create({
  container: { backgroundColor: '#0B1120' },
  text: { color: '#F8FAFC' },
  textMuted: { color: '#94A3B8' },
  primaryText: { color: '#6C9FFF' },
  card: { backgroundColor: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 4 },
  input: { backgroundColor: '#0F172A', borderColor: '#334155' },
  button: { backgroundColor: '#3853b7' },
});

// Estilos adicionais para os campos de macros no modal
// (inseridos via append para não alterar o StyleSheet existente)
const extraStyles = StyleSheet.create({
  dummy: {} // placeholder — os estilos de macro estão inline no StyleSheet principal abaixo
});
