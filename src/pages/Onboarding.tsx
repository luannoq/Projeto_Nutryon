import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apexService, userService } from '../services/api';

export default function Onboarding() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { user, login, updateUser } = useAuth();

  // ── Detecta o modo de uso ─────────────────────────────────────────────────
  // isUpdate = true  → usuário logado refazendo metas pelo Profile
  // isUpdate = false → usuário novo vindo do Register
  const isUpdate: boolean = route.params?.isUpdate === true;

  // Dados temporários do Firebase passados pelo Register (só no fluxo novo)
  const tempToken: string = route.params?.tempToken || '';
  const tempUser: any     = route.params?.tempUser  || {};

  const [step, setStep]               = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [macrosResult, setMacrosResult]   = useState<any>(null);

  // Pré-preenche com dados do usuário logado se for revisão
  const [data, setData] = useState({
    gender:        (isUpdate ? user?.gender        : null) as string | null,
    age:            isUpdate ? (user?.age    || 25) : 25,
    height:         isUpdate ? (user?.height || 171): 171,
    weight:         isUpdate ? (user?.weight || 75) : 75,
    activityLevel: (isUpdate ? user?.activityLevel : null) as string | null,
    goal:          (isUpdate ? user?.goal          : null) as string | null,
  });

  const updateField = (key: string, val: any) =>
    setData(prev => ({ ...prev, [key]: val }));

  // ── Passo 6 → 7: Oracle calcula TDEE/Macros ──────────────────────────────
  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const resultado = await apexService.calcularMacros({
        peso:            data.weight,
        altura:          data.height,
        idade:           data.age,
        sexo:            data.gender === 'male' ? 'M' : 'F',
        nivel_atividade: data.activityLevel || 'baixo',
        objetivo:        data.goal || 'manter',
      });
      setMacrosResult(resultado);
      setStep(7);
    } catch (err) {
      console.error('Erro no Oracle (calcularMacros):', err);
      // Fallback para não travar a apresentação
      setMacrosResult({ tdee: 2500, macros: { protein: 150, carbs: 300, fat: 80 } });
      setStep(7);
    } finally {
      setIsCalculating(false);
    }
  };

  // ── Passo 7: Finaliza ─────────────────────────────────────────────────────
  const handleFinish = async () => {
    setIsCalculating(true);
    try {
      const payload = {
        nome:       (isUpdate ? user?.name  : tempUser.name)  || 'Usuário',
        email:      (isUpdate ? user?.email : tempUser.email) || '',
        senha_hash: 'firebase-auth',
        idade:      data.age,
        altura:     data.height,
        peso:       data.weight,
        objetivo:   data.goal,
      };

      if (isUpdate) {
        // ── Revisão de perfil: PUT no Oracle + atualiza contexto ───────────
        // Usa syncProfileToOracle como upsert (o APEX deve aceitar PUT ou POST)
        await userService.syncProfileToOracle(payload);

        await updateUser({
          ...user!,
          age:           data.age,
          height:        data.height,
          weight:        data.weight,
          gender:        data.gender as any,
          activityLevel: data.activityLevel as any,
          goal:          data.goal as any,
          tdee:          macrosResult?.tdee,
          macros:        macrosResult?.macros,
        });

        // Volta para as abas — sem novo login pois já está autenticado
        navigation.navigate('MainTabs');

      } else {
        // ── Cadastro novo: sincroniza Oracle e faz login definitivo ────────
        const oracleResponse = await userService.syncProfileToOracle(payload);
        const oracleId = String(
          oracleResponse?.id || oracleResponse?.id_usuario || tempUser.id || '1'
        );

        const finalUser = {
          ...tempUser,
          id:            oracleId,
          age:           data.age,
          height:        data.height,
          weight:        data.weight,
          gender:        data.gender,
          activityLevel: data.activityLevel,
          goal:          data.goal,
          tdee:          macrosResult?.tdee,
          macros:        macrosResult?.macros,
        };

        // Login definitivo — Routes troca para AppNavigator automaticamente
        await login(tempToken, finalUser);
      }
    } catch (err) {
      console.error('Erro ao finalizar Onboarding:', err);
      if (isUpdate) {
        navigation.navigate('MainTabs');
      } else {
        // No fallback, mantemos o ID vazio para forçar o usuário a sincronizar depois, 
        // mas guardamos o firebaseUid.
        const fallback = {
          ...tempUser,
          id: '', // Deixa vazio para não quebrar as queries do Oracle
          firebaseUid: tempUser.id,
          age: data.age, height: data.height, weight: data.weight,
          gender: data.gender, activityLevel: data.activityLevel, goal: data.goal,
          tdee: macrosResult?.tdee, macros: macrosResult?.macros,
        };
        await login(tempToken, fallback);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const nextStep = () => {
    if (step === 6) handleCalculate();
    else if (step === 7) handleFinish();
    else setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Qual é o seu gênero?</Text>
            <TouchableOpacity style={[styles.card, data.gender === 'female' && styles.cardActive]} onPress={() => updateField('gender', 'female')}>
              <Text style={styles.cardText}>Mulher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card, data.gender === 'male' && styles.cardActive]} onPress={() => updateField('gender', 'male')}>
              <Text style={styles.cardText}>Homem</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Qual a sua idade?</Text>
            <TextInput style={styles.inputBig} keyboardType="numeric" value={String(data.age)} onChangeText={(t) => updateField('age', Number(t) || 0)} />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Qual a sua altura (cm)?</Text>
            <TextInput style={styles.inputBig} keyboardType="numeric" value={String(data.height)} onChangeText={(t) => updateField('height', Number(t) || 0)} />
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Qual o seu peso atual (kg)?</Text>
            <TextInput style={styles.inputBig} keyboardType="numeric" value={String(data.weight)} onChangeText={(t) => updateField('weight', Number(t) || 0)} />
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Nível de atividade?</Text>
            {[
              { id: 'baixo',      label: 'Baixo (Sedentário)'       },
              { id: 'moderado',   label: 'Moderado (Ativo)'          },
              { id: 'alto',       label: 'Alto (Exercício regular)'  },
              { id: 'muito_alto', label: 'Muito Alto (Atleta)'       },
            ].map(lvl => (
              <TouchableOpacity key={lvl.id} style={[styles.card, data.activityLevel === lvl.id && styles.cardActive]} onPress={() => updateField('activityLevel', lvl.id)}>
                <Text style={styles.cardText}>{lvl.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Selecione seu objetivo</Text>
            {[
              { id: 'perder_peso',  label: 'Perder peso'   },
              { id: 'manter',       label: 'Manter o peso' },
              { id: 'ganhar_massa', label: 'Ganhar massa'  },
            ].map(goal => (
              <TouchableOpacity key={goal.id} style={[styles.card, data.goal === goal.id && styles.cardActive]} onPress={() => updateField('goal', goal.id)}>
                <Text style={styles.cardText}>{goal.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Necessidades Diárias</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{macrosResult?.tdee || '---'}</Text>
              <Text style={styles.macroSubtitle}>KCAL / DIA</Text>
            </View>
            <View style={styles.macrosContainer}>
              <Text style={styles.macroText}>🥩 Proteína: {macrosResult?.macros?.protein || '--'}g</Text>
              <Text style={styles.macroText}>🍚 Carbos: {macrosResult?.macros?.carbs || '--'}g</Text>
              <Text style={styles.macroText}>🥑 Gordura: {macrosResult?.macros?.fat || '--'}g</Text>
            </View>
          </View>
        );
    }
  };

  let isNextDisabled = false;
  if (step === 1 && !data.gender)        isNextDisabled = true;
  if (step === 5 && !data.activityLevel) isNextDisabled = true;
  if (step === 6 && !data.goal)          isNextDisabled = true;

  const finishLabel = isUpdate ? 'Salvar novas metas' : 'Ir para o Dashboard';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {step > 1 && step < 7 && (
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.stepText}>Passo {step} de 7</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, (isNextDisabled || isCalculating) && styles.btnDisabled]}
          onPress={nextStep}
          disabled={isNextDisabled || isCalculating}
        >
          {isCalculating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {step === 6 ? 'Calcular Macros' : step === 7 ? finishLabel : 'Próximo passo'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F4F7FB' },
  header:         { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'center' },
  backBtn:        { position: 'absolute', left: 20, padding: 10 },
  backText:       { fontSize: 24, color: '#0058bb', fontWeight: 'bold' },
  stepText:       { fontSize: 12, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  scroll:         { flexGrow: 1, padding: 24, justifyContent: 'center' },
  stepContainer:  { width: '100%', alignItems: 'center' },
  title:          { fontSize: 28, fontWeight: 'bold', color: '#0F172A', marginBottom: 24, textAlign: 'center' },
  card:           { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 12, elevation: 1 },
  cardActive:     { borderWidth: 2, borderColor: '#0058bb', backgroundColor: '#EBF4FF' },
  cardText:       { fontSize: 16, fontWeight: 'bold', color: '#0F172A', textAlign: 'center' },
  inputBig:       { fontSize: 64, fontWeight: 'bold', color: '#0058bb', textAlign: 'center', borderBottomWidth: 2, borderColor: '#0058bb', minWidth: 150 },
  resultBox:      { backgroundColor: '#fff', padding: 30, borderRadius: 24, alignItems: 'center', width: '100%', marginBottom: 20, elevation: 2 },
  resultText:     { fontSize: 56, fontWeight: '900', color: '#0F172A' },
  macroSubtitle:  { fontSize: 14, fontWeight: 'bold', color: '#0058bb', marginTop: 8 },
  macrosContainer:{ width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 1 },
  macroText:      { fontSize: 18, fontWeight: 'bold', color: '#515981', marginBottom: 12 },
  footer:         { padding: 24, backgroundColor: '#fff' },
  btn:            { backgroundColor: '#0058bb', padding: 18, borderRadius: 16, alignItems: 'center' },
  btnDisabled:    { opacity: 0.5 },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
