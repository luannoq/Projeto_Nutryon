import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apexService, userService } from '../services/api';
import { Alert } from 'react-native';

export default function Onboarding() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { user, login, updateUser } = useAuth();

  // ── Detecta o modo de uso ─────────────────────────────────────────────────
  // isUpdate = true  → usuário logado refazendo metas pelo Profile
  // isUpdate = false → usuário novo vindo do Register
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

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
      setStep(7); // Só avança se deu tudo certo!
    } catch (err) {
      console.error('Erro no Oracle (calcularMacros):', err);
      // Aqui avisamos o utilizador e NÃO AVANÇAMOS de ecrã:
      Alert.alert(
        "Erro no Cálculo", 
        "Não foi possível calcular as tuas metas no servidor. Por favor, verifica os teus dados ou tenta novamente mais tarde."
      );
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
        // ── Revisão de perfil ───────────
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

        // IMPORTANTE: Reseta o step para evitar que, ao voltar aqui, esteja no passo 7
        setStep(1); 

        const navState = navigation.getState();
        if (navState && navState.routeNames.includes('MainTabs')) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }

      } else {
        // ── Cadastro novo ────────
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

        // Reseta o step antes do login para garantir limpeza de estado
        setStep(1); 
        
        // O login troca o motor de navegação
        await login(tempToken, finalUser);
      }
    } catch (err) {
      console.error('Erro ao finalizar Onboarding:', err);
      // ... (mantenha seu bloco catch de erro atual)
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

  const renderStep = (t: { textCol: string; primary: string; cardBg: string; mutedCol: string; inputBg: string; borderC: string }) => {
    const cardStyle    = [styles.card,    { backgroundColor: t.cardBg, borderColor: t.borderC }];
    const cardActive   = [styles.card, styles.cardActive, { backgroundColor: isDark ? 'rgba(108,159,255,0.15)' : '#EBF4FF', borderColor: t.primary }];
    const titleStyle   = [styles.title,  { color: t.textCol }];
    const cardTextStyle= [styles.cardText,{ color: t.textCol }];
    const inputStyle   = [styles.inputBig, { color: t.primary, borderColor: t.primary, backgroundColor: t.inputBg }];

    switch (step) {
      case 1:
        return (
          <>
            <Text style={titleStyle}>Qual é o seu gênero?</Text>
            <TouchableOpacity style={data.gender === 'female' ? cardActive : cardStyle} onPress={() => updateField('gender', 'female')}>
              <Text style={cardTextStyle}>Mulher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={data.gender === 'male' ? cardActive : cardStyle} onPress={() => updateField('gender', 'male')}>
              <Text style={cardTextStyle}>Homem</Text>
            </TouchableOpacity>
          </>
        );
      case 2:
        return (
          <>
            <Text style={titleStyle}>Qual a sua idade?</Text>
            <TextInput style={inputStyle} keyboardType="numeric" value={String(data.age)} onChangeText={(v) => updateField('age', Number(v) || 0)} />
          </>
        );
      case 3:
        return (
          <>
            <Text style={titleStyle}>Qual a sua altura (cm)?</Text>
            <TextInput style={inputStyle} keyboardType="numeric" value={String(data.height)} onChangeText={(v) => updateField('height', Number(v) || 0)} />
          </>
        );
      case 4:
        return (
          <>
            <Text style={titleStyle}>Qual o seu peso atual (kg)?</Text>
            <TextInput style={inputStyle} keyboardType="numeric" value={String(data.weight)} onChangeText={(v) => updateField('weight', Number(v) || 0)} />
          </>
        );
      case 5:
        return (
          <>
            <Text style={titleStyle}>Nível de atividade?</Text>
            {[
              { id: 'baixo',      label: 'Baixo (Sedentário)'      },
              { id: 'moderado',   label: 'Moderado (Ativo)'         },
              { id: 'alto',       label: 'Alto (Exercício regular)' },
              { id: 'muito_alto', label: 'Muito Alto (Atleta)'      },
            ].map(lvl => (
              <TouchableOpacity key={lvl.id} style={data.activityLevel === lvl.id ? cardActive : cardStyle} onPress={() => updateField('activityLevel', lvl.id)}>
                <Text style={cardTextStyle}>{lvl.label}</Text>
              </TouchableOpacity>
            ))}
          </>
        );
      case 6:
        return (
          <>
            <Text style={titleStyle}>Selecione seu objetivo</Text>
            {[
              { id: 'perder_peso',  label: 'Perder peso'   },
              { id: 'manter',       label: 'Manter o peso' },
              { id: 'ganhar_massa', label: 'Ganhar massa'  },
            ].map(goal => (
              <TouchableOpacity key={goal.id} style={data.goal === goal.id ? cardActive : cardStyle} onPress={() => updateField('goal', goal.id)}>
                <Text style={cardTextStyle}>{goal.label}</Text>
              </TouchableOpacity>
            ))}
          </>
        );
      case 7:
        return (
          <>
            <Text style={titleStyle}>Necessidades Diárias</Text>
            <View style={[styles.resultBox, { backgroundColor: t.cardBg }]}>
              <Text style={[styles.resultText, { color: t.textCol }]}>{macrosResult?.tdee || '---'}</Text>
              <Text style={[styles.macroSubtitle, { color: t.primary }]}>KCAL / DIA</Text>
            </View>
            <View style={[styles.macrosContainer, { backgroundColor: t.cardBg }]}>
              <Text style={[styles.macroText, { color: t.mutedCol }]}>🥩 Proteína: {macrosResult?.macros?.protein || '--'}g</Text>
              <Text style={[styles.macroText, { color: t.mutedCol }]}>🍚 Carbos: {macrosResult?.macros?.carbs || '--'}g</Text>
              <Text style={[styles.macroText, { color: t.mutedCol }]}>🥑 Gordura: {macrosResult?.macros?.fat || '--'}g</Text>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  let isNextDisabled = false;
  if (step === 1 && !data.gender)        isNextDisabled = true;
  if (step === 5 && !data.activityLevel) isNextDisabled = true;
  if (step === 6 && !data.goal)          isNextDisabled = true;

  const finishLabel = isUpdate ? 'Salvar novas metas' : 'Ir para o Dashboard';

  const bg      = isDark ? '#0B1120' : '#F4F7FB';
  const cardBg  = isDark ? '#1E293B' : '#FFFFFF';
  const textCol = isDark ? '#F8FAFC' : '#0F172A';
  const mutedCol= isDark ? '#94A3B8' : '#64748B';
  const primary = isDark ? '#6C9FFF' : '#0058bb';
  const inputBg = isDark ? '#0F172A' : '#FFFFFF';
  const borderC = isDark ? '#334155' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: bg }]}>
        {step > 1 && step < 7 && (
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={[styles.backText, { color: primary }]}>{'<'}</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.stepText, { color: mutedCol }]}>Passo {step} de 7</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.stepContainer}>
          {renderStep({ textCol, primary, cardBg, mutedCol, inputBg, borderC })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderC, borderTopWidth: 1 }]}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: primary }, (isNextDisabled || isCalculating) && styles.btnDisabled]}
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
