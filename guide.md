# Contexto: Projeto Nutryon (Mobile - React Native/Expo) - Correção de Fluxo e Integração APEX

**Objetivo:** Atue como Engenheiro Mobile Sênior. O projeto base já está em React Native, mas a lógica de roteamento (Navigation), o fluxo de Onboarding, e o CRUD de refeições possuem falhas arquiteturais que impedem o funcionamento real do app com o back-end (Oracle APEX). Preciso que você reescreva partes específicas dos arquivos listados abaixo.

---

## 🚨 Os 4 Problemas que precisam ser resolvidos:

**1. O Roteamento está pulando o Onboarding (Erro de Lógica)**
* **Onde:** `src/routes/index.tsx` e `src/pages/Register.tsx`.
* **O que acontece:** O `Register` chama `login()` assim que cria o usuário no Firebase. Isso muda o `isAuthenticated` para `true`, o que força o `Routes` a montar o `AppNavigator` (cujo inicio é o Dashboard). O Onboarding é ignorado.
* **A Solução:** 1. Mova a rota `Onboarding` do `AppNavigator` para o `AuthNavigator`.
  2. No `Register.tsx`, após o `userService.register`, **NÃO** chame `login()`. Apenas guarde o token/user temporariamente e faça `navigation.navigate('Onboarding')`.
  3. No `Onboarding.tsx` (Passo 7), após salvar no Oracle, aí sim chame a função `login(token, user)` do `AuthContext` para finalmente liberar o acesso ao `Dashboard`.

**2. O Oracle APEX não recebe/devolve o ID do Usuário**
* **Onde:** `src/services/api.ts` e `src/pages/Onboarding.tsx`.
* **O que acontece:** O `syncProfileToOracle` precisa salvar o perfil e retornar o `id` gerado pelo Oracle (PK da tabela). O App precisa colocar esse `id` no AuthContext, senão o app inteiro usará ID '1'.
* **A Solução:** Ajustar o `syncProfileToOracle` para garantir que o `id` real do banco seja injetado no objeto `user` antes de chamar o `login()`.

**3. O CRUD do Diário está quebrado (Sem filtro de Usuário)**
* **Onde:** `src/services/api.ts` (na parte `mealService`).
* **O que acontece:** A função `list` faz `api.get('/refeicoes/')` de forma genérica.
* **A Solução:** O `list` precisa pegar o ID do usuário (ex: `await getStoredUserId()`) e enviar na requisição (ex: `api.get('/refeicoes/?id_usuario=' + userId)` ou conforme o ORDS espera). 

**4. Dashboard com Dados Hardcoded**
* **Onde:** `src/pages/Dashboard.tsx`.
* **O que acontece:** Os macros não refletem o Onboarding porque o fluxo estava pulando.
* **A Solução:** Garantir que ele leia `user.tdee` e `user.macros` corretamente do Contexto e faça a matemática subtraindo o total consumido de `useMeals`.

---

## 🛠️ Tarefas de Código (Output Esperado)

Por favor, forneça o código completo e refatorado para os seguintes arquivos:

1. **`src/routes/index.tsx`:** Mova a tela `Onboarding` para o `AuthNavigator`.
2. **`src/pages/Register.tsx`:** Remova a chamada do `login()` e direcione para a tela de Onboarding passando os dados iniciais.
3. **`src/pages/Onboarding.tsx`:** Conecte o Passo 6 na API `apexService.calcularMacros` e o Passo 7 na `userService.syncProfileToOracle`. No final do Passo 7, chame o `login(token, user)` do AuthContext passando os macros calculados e o ID retornado do banco.
4. **`src/services/api.ts`:** Ajuste o `mealService.list` para filtrar pelo `id_usuario` real e confirme se `syncProfileToOracle` retorna os dados corretamente.
5. **`src/pages/Dashboard.tsx`:** Confirme a leitura e matemática dos macros com base no TDEE do `user` no Context.

*Regra:* Mantenha todo o design (UI/Styles) que já existe nos arquivos, não altere o StyleSheet. Foque apenas na lógica de navegação, roteamento e nas chamadas do Oracle/Firebase.