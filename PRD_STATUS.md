# Product Requirements Document (PRD) - Sistema Gerenciador de Projetos

## 1. Visão Geral
Sistema de gerenciamento de projetos focado em visualização avançada (Gantt, PERT) e automação inteligente via IA. O objetivo é permitir que gerentes de projeto mantenham cronogramas complexos atualizados com mínimo esforço manual, utilizando um motor de reagendamento em cascata e assistentes de IA para auditoria e chat.

## 2. Tecnologias Principais
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS.
- **UI Framework**: Shadcn/ui.
- **Database**: PostgreSQL (Supabase), Drizzle ORM.
- **AI/LLM**: Vercel AI SDK, OpenAI (GPT-4o-mini).
- **Visualização**: `gantt-task-react` (Gantt), `reactflow` (PERT - implícito/planejado).

---

## 3. Status de Implementação

### 3.1. Core & Infraestrutura
- [x] **Configuração do Projeto**: Next.js + TypeScript + Tailwind.
- [x] **Banco de Dados**: Schema Drizzle definindo `projects` e `tasks`.
- [x] **Conexão DB**: Configuração do `postgres-js` para suportar Transaction Pooler do Supabase.
- [x] **Server Actions**: CRUD básico (`createProject`, `getProject`, `createTask`).
- [x] **Internacionalização**: Tradução completa da interface e feedback para Português (PT-BR).
- [x] **Developer Experience**: Configuração do `nodemon` para restart automático.

### 3.2. Dashboard & Visualização
- [x] **Layout Principal**: Sidebar de navegação, Cabeçalho dinâmico.
- [x] **Lista de Tarefas**: Tabela com exibição de status, datas e responsáveis.
- [x] **Gráfico de Gantt Interativo**:
    - [x] Visualização de tarefas no tempo.
    - [x] Identificação de Caminho Crítico (cor vermelha).
    - [x] Drag & Drop para mover tarefas (eixos X/Y).
    - [x] Zoom (Dia/Hora).
- [x] **Rede PERT (Network Graph)**: Visualização de dependências entre tarefas.
- [x] **Navegação por Abas**: Alternância entre Lista, Gantt e PERT.

### 3.3. Motor de Agendamento (Scheduler Engine)
- [x] **Cálculo de Cronograma (CPM/PERT)**:
    - [x] Cálculo de *Early Start*, *Early Finish*.
    - [x] **Topological Sort**: Resolução robusta de dependências para evitar ciclos e datas inconsistentes.
    - [x] Cálculo de Folga (*Slack*) e identificação do Caminho Crítico (Frontend/Lib).
- [x] **Dependency Cascading (Motor de Reagendamento)**:
    - [x] Detecção de alteração de datas (Drag & Drop no Gantt).
    - [x] Propagação recursiva de atrasos para tarefas dependentes (`propagateChange`).
    - [x] Persistência atômica no banco de dados.

### 3.4. Inteligência Artificial (AI Features)
- [x] **Chat Assistant (Project Copilot)**:
    - [x] Interface de chat flutuante (Sidebar).
    - [x] Integração com Vercel AI SDK (`useChat`).
    - [x] Contexto do projeto injetado no prompt do sistema.
- [x] **Auditoria Inteligente (Smart Audit)**:
    - [x] Identificação automática de tarefas atrasadas (`auditSchedule`).
    - [x] Sugestão de novas datas baseadas no atraso atual.
    - [x] Botão "Auditar Prazos (IA)" no Gantt.
    - [x] Aplicação automática das correções sugeridas (Reagendamento em lote).

---

## 4. Próximos Passos (Backlog Sugerido)

### 4.1. Melhorias de UX/UI
- [ ] **Feedback Visual de Salvamento**: Substituir `alert` por toasts (Sonner/Hot-toast).
- [ ] **Edição Rápida**: Permitir editar nome/duração da tarefa clicando nela no Gantt.
- [ ] **Filtros Avançados**: Filtrar Gantt por responsável ou status.

### 4.2. Funcionalidades de Negócio
- [ ] **Atribuição de Usuários**: Sistema de convite e atribuição real de tarefas a usuários (Auth).
- [ ] **Histórico/Log**: Audit log de quem mudou qual data e quando.
- [ ] **Exportação**: Exportar relatório ou cronograma em PDF/Excel.

### 4.3. Refinamento de IA
- [ ] **Chat com Ferramentas (Function Calling)**: Permitir que o chat execute ações reais (ex: "Crie uma tarefa chamada X").
- [ ] **Análise de Risco**: IA analisar a variância PERT e dar probabilidade de entrega no prazo.

---

## 5. Instruções de Manutenção
- **Rodar Local**: `npm run dev`
- **Schema DB**: `src/db/schema.ts`
- **Lógica de Negócio**: `src/actions/index.ts` (Centraliza lógica de backend para facilitar uso via Server Components e AI).

**Última Atualização**: 14/12/2025
