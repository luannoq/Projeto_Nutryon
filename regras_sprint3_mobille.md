# 📱 Requisitos e Regras - Sprint 3 (Mobile App Development)

[cite_start]Esta é a entrega intermediária mais importante do projeto[cite: 254]. [cite_start]O aplicativo deve estar funcional, permitindo que o problema escolhido seja resolvido, ainda que de forma parcial[cite: 254]. [cite_start]O protótipo da Sprint 1 deve ter sido convertido em uma base real de desenvolvimento[cite: 255]. [cite_start]A Sprint 3 não é fase de rascunho ou simulação; representa a consolidação técnica do projeto[cite: 263, 264].

## 🎯 Resumo da Pontuação (Total: 100 pontos)
* [cite_start]**Navegação entre telas:** 5 pontos [cite: 267]
* [cite_start]**Integração com API backend (HTTP):** 15 pontos [cite: 268]
* [cite_start]**Sistema de autenticação (Login):** 20 pontos [cite: 269]
* [cite_start]**Funcionalidade integrada com Oracle APEX:** 20 pontos [cite: 270]
* [cite_start]**Arquitetura e organização do código:** 20 pontos [cite: 271]
* [cite_start]**Documentação e apresentação da entrega:** 20 pontos [cite: 272]

---

## 📋 Detalhamento dos Requisitos

### 1. Navegação entre Telas (5 pontos)
* [cite_start]**Quantidade mínima:** O aplicativo deve possuir no mínimo 6 telas distintas[cite: 278, 279]. [cite_start]Telas duplicadas ou vazias não contabilizam[cite: 280]. [cite_start]Cada tela deve representar uma funcionalidade diferente[cite: 281].
* [cite_start]**Biblioteca:** A navegação deve ser implementada utilizando uma biblioteca de navegação, como React Navigation ou Expo Router[cite: 282, 283]. [cite_start]Não usar controle manual (`if`, `useState`)[cite: 283].
* [cite_start]**Rotas:** As rotas devem estar explicitamente declaradas[cite: 284, 285].

### 2. Integração com API Backend HTTP (15 pontos)
* [cite_start]**Integração Real:** As requisições devem ser implementadas com TanStack Query (ex: `useQuery`, `useMutation`)[cite: 292, 293]. [cite_start]Dados devem vir exclusivamente da API; nada de dados mockados[cite: 294, 296].
* [cite_start]**Funcionalidades:** Mínimo de duas funcionalidades distintas dependentes da API[cite: 297, 298].
* [cite_start]**CRUD Completo:** Operações de Create, Read, Update e Delete devem estar implementadas nas duas funcionalidades por meio da interface[cite: 300, 301, 302]. [cite_start]CRUD parcialmente simulado não será aceito[cite: 304].
* [cite_start]**Estados (Loading/Update):** Exibir estado de carregamento durante requisições[cite: 305, 306]. [cite_start]Alterações devem refletir automaticamente na interface sem precisar reiniciar o app[cite: 307].

### 3. Funcionalidade Integrada com Oracle APEX (20 pontos)
* [cite_start]**Lógica no APEX:** Implementar uma funcionalidade real no Oracle APEX, indo além de cadastros simples[cite: 312, 313, 314]. [cite_start]A lógica principal (regras de negócio/processamento) deve estar no APEX[cite: 315].
* [cite_start]**Exposição via API:** A funcionalidade deve ser exposta por meio de API REST[cite: 316, 317].
* [cite_start]**Consumo pelo App:** O app deve consumir essa API, e a interação deve ser essencial para o funcionamento do app[cite: 320, 321, 322].
* [cite_start]**Demonstração:** Na apresentação, deve ficar clara a funcionalidade no APEX, a chamada da API e o reflexo no aplicativo[cite: 324, 325, 326, 327].

### 4. Arquitetura e Organização do Código (20 pontos)
* [cite_start]**Separação de Responsabilidades:** Separar claramente interface, lógica de negócio e camada de acesso a dados[cite: 333, 334, 335, 336, 337]. [cite_start]Sem regras de negócio/chamadas HTTP direto na tela[cite: 338].
* [cite_start]**Pastas:** Estrutura clara e padronizada, permitindo identificar telas, serviços, hooks e componentes[cite: 339, 340, 342].
* [cite_start]**Hooks e Abstrações:** Lógica reutilizável deve estar em hooks ou serviços[cite: 343, 344]. [cite_start]Hooks do TanStack Query devem ser isolados da UI[cite: 346].
* [cite_start]**Manutenibilidade:** Nomes coerentes; código não deve ser excessivamente acoplado[cite: 347, 348, 349].

### 5. Documentação e Vídeo de Apresentação (20 pontos)
* [cite_start]**README.md (5 pts):** Deve conter a descrição do problema, solução proposta, tecnologias e instruções básicas de execução[cite: 355, 356, 357, 358, 359, 360].
* [cite_start]**Vídeo (15 pts):** Máximo de 5 minutos, publicado no YouTube (não listado), contendo narração[cite: 361, 362, 363, 373]. [cite_start]Deve demonstrar navegação, auth, integração API, Oracle APEX e comportamento real[cite: 364, 366, 367, 368, 369, 370].

---

## 🚫 Penalidades Críticas (Atenção!)
* [cite_start]**Não usar GitHub Classroom:** -20 pontos[cite: 379, 380].
* [cite_start]**Ausência de Vídeo:** -20 pontos[cite: 381, 382].
* [cite_start]**Falta de Tema (Claro/Escuro):** -20 pontos[cite: 385, 386].
* [cite_start]**Integrações Simuladas (Mock/Apenas GET):** -40 pontos[cite: 399, 402, 405].
* [cite_start]**Sistema de Autenticação Fictício:** -40 pontos[cite: 415, 416].
* [cite_start]**Remover funcionalidades antigas ou app não funcional:** Zera a Sprint (-100 pontos)[cite: 389, 390, 391, 439, 440].
* [cite_start]**Vídeo incompatível com o app entregue:** Zera a Sprint (-100 pontos)[cite: 451, 452].