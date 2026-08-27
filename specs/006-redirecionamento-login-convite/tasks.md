---

description: "Task list for redirecionamento de login/cadastro ao responder convite"
---

# Tasks: Redirecionamento de login/cadastro ao responder convite

**Input**: Design documents from `/specs/006-redirecionamento-login-convite/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: Não solicitados explicitamente na spec. Incluídos apenas onde cobrem código realmente
alterado (a config de rota e a limpeza em `ConviteResponder`); as demais verificações por User
Story são manuais, via [quickstart.md](quickstart.md), pois a maior parte do comportamento é
delegada a guards já existentes e testados (`authGuard`, `accountGuard`).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing
of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths are relative to the repository root (`c:\Users\rafae\source\repos\dashfinras-web`)

## Phase 1: Setup

Nenhuma tarefa de setup necessária — nenhuma dependência nova, nenhuma estrutura de projeto nova.
Ambiente de desenvolvimento já documentado em [quickstart.md](quickstart.md) (`npm run start:dev`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Garantir que a rota `/convites/:token` exige sessão e cadastro completo antes de
carregar o componente — pré-requisito para as três User Stories, já que todas dependem da mesma
mudança de configuração de rota.

**⚠️ CRITICAL**: Nenhuma User Story pode ser validada antes desta fase estar completa.

- [X] T001 Adicionar `canActivate: [authGuard, accountGuard]` à rota `convites/:token` em `src/app/app-routing-module.ts` (mesmo par de guards, na mesma ordem, já usado pela rota `paineis`)
- [X] T002 [P] Criar `src/app/app-routing-module.spec.ts` com um teste verificando que a rota `convites/:token` tem `canActivate` igual a `[authGuard, accountGuard]`

**Checkpoint**: Com T001/T002 concluídas, abrir `/convites/:token` sem sessão já redireciona para
`/login`, e sem cadastro completo já redireciona para `/completar-cadastro` — a base para todas as
User Stories está pronta.

---

## Phase 3: User Story 1 - Decidir convite sem estar autenticado (Priority: P1)

**Goal**: Quem abre o link do convite sem sessão ativa é levado a fazer login (ou se cadastrar) e
retorna automaticamente à tela do mesmo convite.

**Independent Test**: Abrir o link de um convite pendente em uma janela sem sessão ativa, fazer
login com uma conta já cadastrada e confirmar o retorno à tela daquele convite.

Nenhuma implementação nova é necessária nesta fase além da Fase 2 (Foundational) — `authGuard` já
redireciona para `/login?redirectUrl=...` e `login.ts` já navega de volta ao `redirectUrl` após
autenticar. As tarefas abaixo são de validação.

- [ ] T003 [US1] Validar manualmente o cenário "US1 — Sem sessão ativa" do [quickstart.md](quickstart.md): abrir `/convites/:token` sem sessão, confirmar redirecionamento para `/login?redirectUrl=%2Fconvites%2F<token>` e retorno ao convite após login
- [ ] T004 [US1] Validar manualmente o cenário "US1 (variação) — Criar conta nova a partir do convite" do [quickstart.md](quickstart.md): confirmar que, ao criar conta nova a partir do login redirecionado, a navegação segue para `/completar-cadastro?redirectUrl=%2Fconvites%2F<token>` (não direto para o convite)

**Checkpoint**: User Story 1 validada de forma independente — login a partir de um convite sempre
retorna ao mesmo convite (ou ao cadastro, se a conta for nova).

---

## Phase 4: User Story 2 - Completar cadastro antes de decidir o convite (Priority: P1)

**Goal**: Quem está autenticado mas sem cadastro de usuário completo é levado a completar o
cadastro antes de decidir o convite, retornando à tela do convite ao concluir.

**Independent Test**: Com uma conta Supabase autenticada mas sem cadastro de usuário completo,
abrir o link de um convite pendente, completar o cadastro e confirmar o retorno à tela daquele
convite.

Nenhuma implementação nova é necessária além da Fase 2 (Foundational) — `accountGuard` já
redireciona para `/completar-cadastro?redirectUrl=...` e `completar-cadastro.ts` já navega de volta
ao `redirectUrl` após concluir o cadastro. A tarefa abaixo é de validação.

- [ ] T005 [US2] Validar manualmente o cenário "US2 — Autenticado sem cadastro completo" do [quickstart.md](quickstart.md): abrir `/convites/:token` autenticado mas sem cadastro, confirmar redirecionamento para `/completar-cadastro?redirectUrl=%2Fconvites%2F<token>` e retorno ao convite após concluir o cadastro

**Checkpoint**: User Stories 1 e 2 validadas de forma independente.

---

## Phase 5: User Story 3 - Aprovar ou recusar o convite já autenticado e cadastrado (Priority: P1)

**Goal**: Quem já está autenticado e com cadastro completo vê a tela do convite imediatamente
(sem redirecionamento) e consegue aprovar ou recusar o acesso ao painel.

**Independent Test**: Com uma conta autenticada e cadastro completo, abrir o link de um convite
pendente destinado a essa conta e confirmar que aprovar/recusar atualiza o status do convite sem
passar por login ou cadastro.

### Implementation for User Story 3

- [X] T006 [US3] Remover a checagem de autenticação ad-hoc (`await this.authService.waitUntilReady(); if (!this.authService.isAuthenticated) { ... }`) de dentro de `responder()` em `src/app/features/convite/convite-responder/convite-responder.ts` — a rota já garante sessão válida via `authGuard` (Fase 2), tornando esse branch redundante; manter apenas a chamada a `chamada()` e seu tratamento de erro existente
- [X] T007 [US3] Remover a injeção de `AuthService` de `convite-responder.ts` caso, após T006, ela não seja mais usada em nenhum outro ponto do componente
- [X] T008 [P] [US3] Criar `src/app/features/convite/convite-responder/convite-responder.spec.ts` cobrindo: carregamento do convite assumindo sessão já válida (`ngOnInit` chama `obterConvitePorToken` diretamente, sem checar autenticação), sucesso de `aceitar()`, sucesso de `recusar()`, e o mapeamento de erro por `codigo` (`CONVITE_EXPIRED`, `CONVITE_ALREADY_RESOLVED`, `CONVITE_NOT_FOUND`)
- [ ] T009 [US3] Validar manualmente o cenário "US3 — Já autenticado e cadastrado" do [quickstart.md](quickstart.md): confirmar que a tela do convite aparece sem redirecionamento e que aprovar/recusar funciona
- [ ] T010 [US3] Validar manualmente o cenário "Edge case — Token inválido/expirado sem sessão" do [quickstart.md](quickstart.md): confirmar que, sem sessão, o redirecionamento para login acontece antes de qualquer mensagem de erro do convite

**Checkpoint**: Todas as três User Stories funcionam de forma independente e a jornada completa
login/cadastro → convite está coberta.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Garantir que a mudança não regrediu comportamento existente e que a documentação do
projeto reflete a nova rota guardada.

- [X] T011 [P] Rodar a suíte completa (`npm test`) e confirmar que `login.spec.ts`, `completar-cadastro.spec.ts` e `account.guard.spec.ts` continuam passando sem alteração
- [X] T012 Atualizar a seção "Module/routing structure" de `CLAUDE.md` para documentar que `/convites/:token` agora usa `canActivate: [authGuard, accountGuard]`, junto às demais rotas guardadas já listadas ali

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Nenhuma tarefa — sem dependências
- **Foundational (Phase 2)**: Bloqueia todas as User Stories — deve ser concluída primeiro (T001 antes de T002, já que o teste em T002 valida a config feita em T001)
- **User Stories (Phase 3-5)**: Todas dependem apenas da Fase 2; podem ser validadas em qualquer ordem entre si, mas seguem a ordem de prioridade da spec (P1, P1, P1 — mesma prioridade, ordem de aparição na spec)
- **Polish (Phase 6)**: Depende de todas as User Stories estarem validadas

### User Story Dependencies

- **User Story 1**: Depende apenas da Fase 2 (Foundational). Sem dependência de US2/US3.
- **User Story 2**: Depende apenas da Fase 2 (Foundational). Sem dependência de US1/US3.
- **User Story 3**: Depende da Fase 2 (Foundational). T006-T008 (mudança em `convite-responder.ts`) não dependem de US1/US2 terem sido validadas manualmente antes, mas fazem mais sentido depois, já que é nessa tela que as três jornadas convergem.

### Within User Story 3

- T006 antes de T007 (remover a injeção só depois de confirmar que o método que a usava foi limpo)
- T008 pode rodar em paralelo com T006/T007 (arquivo novo, não depende do resultado exato da limpeza, mas deve refletir o comportamento final)
- T009/T010 (validação manual) depois de T006-T008

### Parallel Opportunities

- T002 pode rodar em paralelo com a leitura/preparação de T001, mas como valida o resultado de T001 deve ser escrito depois (mesmo assim, arquivo diferente — marcado `[P]`)
- T003, T004, T005 (validações manuais de US1/US2) podem ser feitas em paralelo por pessoas diferentes, já que dependem apenas da Fase 2
- T008 (novo spec file) pode ser escrito em paralelo com T006/T007 (arquivos diferentes: `.spec.ts` novo vs. `.ts` existente)
- T011 e T012 (Polish) são independentes entre si

---

## Parallel Example: Foundational + User Story 3

```bash
# Depois de T001 (config de rota):
Task: "Criar src/app/app-routing-module.spec.ts validando canActivate de convites/:token"          # T002

# Em paralelo, na Fase 5:
Task: "Remover checagem de auth ad-hoc em convite-responder.ts"                                     # T006 → T007
Task: "Criar convite-responder.spec.ts cobrindo carregamento, aceitar() e recusar()"                # T008
```

---

## Implementation Strategy

### MVP First

1. Completar Fase 2 (Foundational) — T001, T002. Isso já entrega o essencial das três User Stories
   (redirecionamento correto), já que a lógica de retorno pós-login/cadastro já existe no app.
2. Validar User Story 1 (T003, T004) e User Story 2 (T005) — nenhum código adicional, só validação.
3. Completar User Story 3 (T006-T010) — único ponto com mudança de código além da rota,
   removendo a checagem de auth redundante e cobrindo o componente com testes.
4. Polish (T011, T012).

### Incremental Delivery

1. Fase 2 pronta → redirecionamento básico (US1 + US2) já funciona de ponta a ponta, sem esperar
   pela limpeza de código da US3.
2. US3 pronta → fluxo completo (aprovar/recusar sem redirecionamento indevido) testado e limpo.
3. Polish garante que nada mais no app quebrou e que a documentação está atualizada.

---

## Notes

- Esta feature é predominantemente uma reconfiguração de rota (Fase 2) — a maior parte do
  "trabalho" das User Stories 1 e 2 já existe em `authGuard`, `accountGuard`, `login.ts` e
  `completar-cadastro.ts`; por isso essas fases têm apenas tarefas de validação manual.
- [P] tasks = arquivos diferentes, sem dependência entre si
- [Story] label mapeia a tarefa à User Story correspondente para rastreabilidade
- Rodar `npm test` (T011) antes de considerar a feature concluída
- Consultar [quickstart.md](quickstart.md) para o passo a passo detalhado de cada validação manual
