# 🍏 Nutryon — Aplicativo de Nutrição e Controle de Macros

**Sprint 4 — Mobile App Development | FIAP**

## 👥 Integrantes
- **Renato Silva Alexandre Bezerra** (RM560928)
- **Victor Rodrigues De Lima** (RM560087)
- **Luann Noqueli Klochko** (RM560313)
- **Lucas Higuti Fontanezi** (RM561120)

---
## 🎥 Vídeo de Apresentação

Demonstração completa do aplicativo Nutryon funcionando na Sprint 3, cobrindo: autenticação, navegação, CRUD de refeições, integração com Oracle APEX e arquitetura do código.

▶️ [Assistir no YouTube](https://youtu.be/k7_Uwum0Qhc)

---

## 📖 Descrição do Problema

Pessoas que buscam melhorar a dieta enfrentam cálculos complexos de calorias e macronutrientes, baixa aderência ao registro manual e falta de confiabilidade nos aplicativos disponíveis. O **Nutryon** resolve esse problema através do cálculo automático de TDEE e macros executado diretamente no banco de dados Oracle APEX, além de oferecer um registro rápido de refeições e relatórios visuais de consumo diário.

---

## 💡 Solução Proposta

Um aplicativo mobile robusto que:
1. Autentica o usuário de forma segura via **Firebase Auth**.
2. Coleta dados físicos (peso, altura, idade, sexo, nível de atividade e objetivo) através de um **Onboarding** interativo.
3. Envia os dados coletados ao **Oracle APEX**, que executa a função PL/SQL `fn_calcular_tdee` no lado do servidor e retorna o TDEE e a divisão exata de macronutrientes (proteína, carboidrato, gordura).
4. Permite registrar, listar, editar e excluir refeições diárias com **CRUD completo 100% integrado à API**.
5. Exibe um **Dashboard** com o consumo atual vs. meta e **Relatórios** históricos por dia.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| **Mobile Framework** | React Native (Expo) + TypeScript |
| **Autenticação** | Firebase Auth (Email/Senha) |
| **Backend / Banco** | Oracle APEX (ORDS REST) + PL/SQL |
| **Navegação** | React Navigation (Native Stack + Bottom Tabs) |
| **Estado Assíncrono** | TanStack Query (`useQuery`, `useMutation`) |
| **HTTP Client** | Axios (com configuração global e headers) |
| **Persistência de Sessão** | AsyncStorage |

---

## 📂 Estrutura do Projeto

A arquitetura foi desenhada focando na separação clara de responsabilidades (UI, Estado e Serviços HTTP):

```text
src/
├── context/        # AuthContext (controle de sessão) e ThemeContext (claro/escuro)
├── hooks/          # useApi.ts (TanStack Query) e useNotifications.ts (notificações locais)
├── pages/          # Login, Register, Onboarding, Dashboard, MealLog, Reports, Profile, AboutApp
├── routes/         # index.tsx — React Navigation (AuthStack, AppStack e TabNavigator)
├── services/       # api.ts — Instância Axios e funções de bypass do WAF da Oracle
└── types.ts        # Tipagem global TypeScript (User, Meal, AuthState)
```
## ⚙️ Como Executar

### Pré-requisitos
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go instalado no dispositivo físico (Android/iOS) ou Emulador

### Passos para rodar localmente

```bash
# 1. Clone o repositório e acesse a pasta do projeto

# 2. Instale as dependências
npm install

# 3. Limpe o cache e inicie o servidor Metro Bundler
npx expo start -c

# 4. Escaneie o QR Code com o aplicativo Expo Go
```
## 🔗 Integração com Oracle APEX e Solução de Arquitetura

O backend utiliza a infraestrutura do Oracle APEX Free Tier (`oracleapex.com`) utilizando o ORDS como camada de serviços RESTful.

**Endpoints Mapeados:**

| Método | Endpoint | Função |
|---|---|---|
| `POST` | `/api/usuarios/` | Cadastro e sincronização de identidade do usuário |
| `POST` | `/api/calcular_macros/` | Aciona a function PL/SQL `fn_calcular_tdee` |
| `POST` | `/api/refeicoes/` | Criação de uma nova refeição na `TBL_REFEICOES` |
| `POST` | `/api/refeicoes/buscar/` | **[WAF BYPASS]** Leitura da lista de refeições do usuário |
| `PUT` | `/api/refeicoes/:id` | Atualiza os dados de uma refeição existente |
| `DELETE` | `/api/refeicoes/:id` | Remove uma refeição do banco de dados |

> 🚨 **Engenharia de Redes / Bypass do WAF (Web Application Firewall):**
> O ambiente gratuito da Oracle utiliza um firewall corporativo (Akamai CDN) que bloqueia sumariamente requisições originadas do método `GET` por aplicações mobile (erro `fw_error_www` / `403 Forbidden`). 
> **Solução implementada:** Para garantir que a aplicação realize integrações reais com o banco de dados (sem depender de simulações com dados mockados ou caches locais), mapeamos um handler exclusivo utilizando o método `POST` (`/refeicoes/buscar/`). Este endpoint recebe o ID do usuário no corpo da requisição e executa um script PL/SQL (`apex_json`) que devolve a lista de refeições estruturada, contornando a restrição de rede do firewall.

---

## 🎨 Tema Claro / Escuro

O design do Nutryon suporta modo Claro e Escuro de forma nativa e responsiva em todas as telas. A alternância é feita manualmente pelo usuário através do ícone no Header da aplicação, com o estado sendo gerido globalmente pelo `ThemeContext`.

---

## ✅ Funcionalidades Implementadas (Checklist da Sprint 3)

- [x] Aplicativo com 7 telas distintas fluindo via React Navigation.
- [x] Autenticação Real utilizando o Firebase Auth.
- [x] Sincronização Dupla: Firebase gerenciando a segurança da credencial e Oracle APEX gerindo o ID relacional.
- [x] Regra de Negócio no Backend: Cálculo de TDEE via PL/SQL acionado pelo frontend.
- [x] CRUD Completo: Inserção, leitura, atualização e exclusão de refeições integradas 100% à nuvem (sem dados simulados).
- [x] Gestão de estado assíncrono profissional com TanStack Query (exibindo Loading states automáticos em operações demoradas).
- [x] Dashboard dinâmico comparando consumo vs. meta calórica.
- [x] Persistência contínua de sessão de usuário.

---

## 🚀 Novidades da Sprint 4

A Sprint 4 consolida o projeto com a camada de **engajamento (notificações locais)**, **identidade do release (tela Sobre o App)** e **infraestrutura de publicação (EAS Build + Firebase App Distribution)**.

### 🔔 Notificações Locais (`expo-notifications`)

Hook centralizado em [src/hooks/useNotifications.ts](src/hooks/useNotifications.ts) com três cenários reais conectados ao contexto do app:

| Método | Quando dispara | O que faz |
|---|---|---|
| `requestPermission()` | Inicialização do app (`App.tsx`) | Solicita permissão e cria o canal de notificação Android (`default`) |
| `scheduleDaily()` | Após login (`Login.tsx`) e ao finalizar o Onboarding (`Onboarding.tsx`) | Agenda dois lembretes diários recorrentes: **12h** (almoço) e **19h** (revisão do dia) usando trigger `DAILY` real do SDK |
| `checkCalorieThreshold(consumed, tdee)` | No `Dashboard` quando as refeições do dia carregam | Dispara um alerta imediato quando o consumo atinge **≥ 90%** do TDEE do usuário (uso de `useRef` para evitar disparos duplicados na mesma sessão) |

O `Dashboard` agora filtra as refeições por **data de hoje** antes de avaliar o threshold, garantindo que o alerta reflete o consumo do dia corrente.

### ℹ️ Tela "Sobre o App"

Nova tela em [src/pages/AboutApp.tsx](src/pages/AboutApp.tsx), acessível pelo `Profile`, exibindo:
- Nome, versão e **hash do commit** de referência do release publicado
- Stack técnica (React Native + Expo SDK 54, Oracle APEX/ORDS)
- Lista dos integrantes do grupo com RMs

A rota foi registrada no `AppStack` em [src/routes/index.tsx](src/routes/index.tsx).

### 👤 Tela de Perfil reorganizada

[src/pages/Profile.tsx](src/pages/Profile.tsx) ganhou dois botões secundários:
- **Refazer Onboarding** — navega para `Onboarding` com `isUpdate: true`, permitindo recalcular metas sem perder a conta
- **Sobre o App** — navega para a nova tela `AboutApp`

### 📦 Infraestrutura de Build & Distribuição

- [eas.json](eas.json) — perfis `development`, `preview` (APK para distribuição interna via Firebase) e `production`
- [app.json](app.json) — plugin `expo-notifications` configurado, permissões Android (`POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`) e `package: com.luannoq.nutryonmobile` para o build EAS

Comando de build do APK de distribuição:

```bash
npx eas build --platform android --profile preview
```

### ✅ Checklist da Sprint 4

- [x] **Notificações locais reais** (lembretes diários + alerta de threshold calórico) integradas ao fluxo do app
- [x] **Tela "Sobre o App"** com hash do commit e integrantes
- [x] **Permissão de notificação** solicitada na inicialização
- [x] **EAS Build** configurado para gerar APK de distribuição interna
- [x] **Plugin expo-notifications** e permissões Android declarados no `app.json`
- [x] **Filtro de refeições por data** no Dashboard (consumo correto do dia corrente)
- [x] **Nenhuma tela ou funcionalidade da Sprint 3 foi removida ou descaracterizada**
