# 🏗️ Arquitetura e Fluxos - Projeto Nutryon (React Native + Oracle APEX)

Este documento serve como contexto técnico absoluto sobre a arquitetura do aplicativo Nutryon. Qualquer sugestão de código ou correção deve respeitar rigorosamente esta estrutura.

## 1. Tech Stack
* **Frontend:** React Native (Expo) com TypeScript.
* **Autenticação:** Firebase Auth (Email/Senha).
* **Backend / Banco de Dados:** Oracle APEX (via Oracle REST Data Services - ORDS).
* **Navegação:** React Navigation (Native Stack e Bottom Tabs).

---

## 2. Estrutura de Rotas (React Navigation)
O aplicativo possui duas stacks principais controladas pelo estado de autenticação (`isAuthenticated`):

1. **AuthNavigator (Usuário Deslogado):**
   * `Login` (Tela inicial padrão)
   * `Register` (Criação de conta)
   * `Onboarding` (Coleta de dados físicos na criação da conta)

2. **AppNavigator (Usuário Logado):**
   * Redirecionamento principal fixo para a stack de Tabs.
   * `MainTabs` (Bottom Tab Navigator contendo: `Dashboard`, `MealLog`, `Reports`, `Profile`).
   * `Onboarding` (Acessível via Perfil para atualizar metas).

---

## 3. O Coração do Sistema: Fluxo de Autenticação e Sincronização
A regra de negócio mais importante do Nutryon é a **Dupla Identidade**. O Firebase gerencia a segurança, mas o banco de dados oficial é o Oracle.

**Passo a passo do Login/Registro:**
1. O usuário se autentica no Firebase (`signInWithEmailAndPassword`). O Firebase retorna um token e um UID alfanumérico (ex: `aB3dE...`).
2. Imediatamente após o Firebase aprovar, o app faz um `POST` para o endpoint `/usuarios/` no Oracle APEX.
3. O Oracle recebe o e-mail/nome do usuário, verifica no banco relacional e devolve o **`id_usuario` numérico** correspondente (ex: `21`).
4. O app salva esse **ID Numérico (`21`)** no `AsyncStorage` (cache local).
5. **Regra de Ouro:** Todas as requisições futuras de CRUD (como Adicionar ou Listar Refeições) utilizam **APENAS o ID numérico do Oracle**, recuperado via função `getStoredUserId()`.

---

## 4. Comunicação com a API e Bypass de Firewall (WAF)
O Oracle APEX está na camada gratuita (oracleapex.com) e possui um firewall rigoroso que bloqueia requisições originadas de dispositivos mobile (identificadas pelo Expo/Localhost). Para burlar isso, nossa camada de API (`api.ts`) é configurada da seguinte forma:

* **Para requisições POST (Axios):**
  Enviamos os headers mascarados:
  `'Origin': 'https://oracleapex.com'`
  `'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'`
  *(Isso convence o WAF de que a requisição é interna e feita por um PC).*

* **Para requisições GET (Fetch Nativo):**
  O Axios buga ao enviar parâmetros de query (`?id_usuario=21`) junto com headers mascarados. Portanto, para rotas GET, usamos o `fetch` nativo enviando **apenas** o `User-Agent`, e omitindo o `Origin` (pois o WAF bloqueia GETs com Origin explícito).

---

## 5. Telas e Responsabilidades
* **Login/Register:** Portas de entrada. Onde ocorre a sincronização Firebase -> Oracle.
* **Onboarding:** Coleta Idade, Peso, Altura, Sexo, Nível de Atividade e Objetivo. Consome o endpoint `/calcular_macros/` (PL/SQL no Oracle) para gerar o TDEE e divisão de macros.
* **Dashboard:** Resumo diário de calorias consumidas vs. TDEE.
* **MealLog (Diário):** CRUD de refeições (Nome, Kcal, Proteína, Carbo, Gordura). Salva na tabela `TBL_REFEICOES` do Oracle usando o `id_usuario`.
* **Reports/Profile:** Relatórios de aderência e gestão de conta.# 🏗️ Arquitetura e Fluxos - Projeto Nutryon (React Native + Oracle APEX)

Este documento serve como contexto técnico absoluto sobre a arquitetura do aplicativo Nutryon. Qualquer sugestão de código ou correção deve respeitar rigorosamente esta estrutura.

## 1. Tech Stack
* **Frontend:** React Native (Expo) com TypeScript.
* **Autenticação:** Firebase Auth (Email/Senha).
* **Backend / Banco de Dados:** Oracle APEX (via Oracle REST Data Services - ORDS).
* **Navegação:** React Navigation (Native Stack e Bottom Tabs).

---

## 2. Estrutura de Rotas (React Navigation)
O aplicativo possui duas stacks principais controladas pelo estado de autenticação (`isAuthenticated`):

1. **AuthNavigator (Usuário Deslogado):**
   * `Login` (Tela inicial padrão)
   * `Register` (Criação de conta)
   * `Onboarding` (Coleta de dados físicos na criação da conta)

2. **AppNavigator (Usuário Logado):**
   * Redirecionamento principal fixo para a stack de Tabs.
   * `MainTabs` (Bottom Tab Navigator contendo: `Dashboard`, `MealLog`, `Reports`, `Profile`).
   * `Onboarding` (Acessível via Perfil para atualizar metas).

---

## 3. O Coração do Sistema: Fluxo de Autenticação e Sincronização
A regra de negócio mais importante do Nutryon é a **Dupla Identidade**. O Firebase gerencia a segurança, mas o banco de dados oficial é o Oracle.

**Passo a passo do Login/Registro:**
1. O usuário se autentica no Firebase (`signInWithEmailAndPassword`). O Firebase retorna um token e um UID alfanumérico (ex: `aB3dE...`).
2. Imediatamente após o Firebase aprovar, o app faz um `POST` para o endpoint `/usuarios/` no Oracle APEX.
3. O Oracle recebe o e-mail/nome do usuário, verifica no banco relacional e devolve o **`id_usuario` numérico** correspondente (ex: `21`).
4. O app salva esse **ID Numérico (`21`)** no `AsyncStorage` (cache local).
5. **Regra de Ouro:** Todas as requisições futuras de CRUD (como Adicionar ou Listar Refeições) utilizam **APENAS o ID numérico do Oracle**, recuperado via função `getStoredUserId()`.

---

## 4. Comunicação com a API e Bypass de Firewall (WAF)
O Oracle APEX está na camada gratuita (oracleapex.com) e possui um firewall rigoroso que bloqueia requisições originadas de dispositivos mobile (identificadas pelo Expo/Localhost). Para burlar isso, nossa camada de API (`api.ts`) é configurada da seguinte forma:

* **Para requisições POST (Axios):**
  Enviamos os headers mascarados:
  `'Origin': 'https://oracleapex.com'`
  `'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'`
  *(Isso convence o WAF de que a requisição é interna e feita por um PC).*

* **Para requisições GET (Fetch Nativo):**
  O Axios buga ao enviar parâmetros de query (`?id_usuario=21`) junto com headers mascarados. Portanto, para rotas GET, usamos o `fetch` nativo enviando **apenas** o `User-Agent`, e omitindo o `Origin` (pois o WAF bloqueia GETs com Origin explícito).

---

## 5. Telas e Responsabilidades
* **Login/Register:** Portas de entrada. Onde ocorre a sincronização Firebase -> Oracle.
* **Onboarding:** Coleta Idade, Peso, Altura, Sexo, Nível de Atividade e Objetivo. Consome o endpoint `/calcular_macros/` (PL/SQL no Oracle) para gerar o TDEE e divisão de macros.
* **Dashboard:** Resumo diário de calorias consumidas vs. TDEE.
* **MealLog (Diário):** CRUD de refeições (Nome, Kcal, Proteína, Carbo, Gordura). Salva na tabela `TBL_REFEICOES` do Oracle usando o `id_usuario`.
* **Reports/Profile:** Relatórios de aderência e gestão de conta.