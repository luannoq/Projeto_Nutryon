# Nutryon - Aplicativo de Nutrição e Controle de Macros

Este projeto é uma entrega intermediária (Sprint 3) para o curso de Mobile App Development da FIAP. O Nutryon é uma solução completa para cálculo de TDEE, distribuição de macronutrientes e acompanhamento diário de alimentação.

## 🚀 Tecnologias Utilizadas

- **React 18** com **Vite**
- **TypeScript** para tipagem estática e segurança
- **Tailwind CSS** para estilização utilitária
- **React Router DOM** para navegação entre telas
- **TanStack Query (React Query)** para gerenciamento de estado assíncrono e cache de API
- **Axios** para requisições HTTP
- **Lucide React** para iconografia
- **Motion (Framer Motion)** para animações e transições
- **Recharts** para visualização de dados e relatórios

## 📂 Estrutura do Projeto

```
src/
├── components/     # Componentes de UI reutilizáveis
├── context/        # Contextos (Autenticação)
├── hooks/          # Hooks customizados (useApi, etc.)
├── lib/            # Utilitários (cn, etc.)
├── pages/          # Telas da aplicação (Login, Dashboard, etc.)
├── services/       # Camada de serviço e integração com API
├── types/          # Definições de tipos TypeScript
└── App.tsx         # Configuração de rotas e provedores
```

## 🛠️ Funcionalidades Implementadas

1.  **Navegação Funcional:** Mais de 6 telas distintas com rotas protegidas.
2.  **Sistema de Autenticação:** Login e Registro reais com persistência de sessão via localStorage.
3.  **Integração com API (HTTP):** Camada de serviço utilizando Axios e TanStack Query para operações assíncronas.
4.  **CRUD Completo:**
    *   **Refeições:** Criar, Listar, Atualizar e Excluir refeições diárias.
    *   **Perfil:** Visualização e atualização de dados biométricos e objetivos.
5.  **Cálculo Automático:** Lógica de cálculo de TDEE e macros baseada no perfil do usuário.
6.  **Relatórios:** Gráficos de evolução de peso e consumo calórico semanal.

## ⚙️ Como Executar

1.  Instale as dependências:
    ```bash
    npm install
    ```
2.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
3.  Acesse `http://localhost:3000` no seu navegador.

## 📝 Notas de Implementação

- A aplicação está preparada para integração com o **Oracle APEX** via variáveis de ambiente (`VITE_API_URL`).
- Foram implementados estados de carregamento (loading) e feedback visual para todas as operações assíncronas.
- O design segue a estratégia "Clinical Curator", focando em clareza, autoridade e usabilidade.
