---

description: "Task list template for feature implementation"
---

# Tasks: Histórico de convites no modal de usuários

**Input**: Design documents from `specs/003-historico-convites-usuarios/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/convites-tab-api.md,
quickstart.md

**Tests**: Não solicitados explicitamente no spec — validação via `quickstart.md` (Polish) e
regressão dos specs `ng test` já existentes.

**Organization**: Tarefas agrupadas por user story (spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1, US2
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Toda a feature vive em `src/app/features/painel/painel-detalhe/` — extensão do modal "Usuários do
painel" já implementado na issue #22, no mesmo componente `PainelDetalhe`.

---

## Phase 1: Setup

- [ ] T001 Confirmar que `npm run start:dev` sobe UI + BFF localmente com um painel de teste que já
      tenha convites em pelo menos 2 status diferentes (pré-requisito manual, sem arquivo de
      código; pode usar o fluxo de convite da issue #23 pra popular)

---

## Phase 2: Foundational

Não há tarefas foundational bloqueantes — não há modelo/serviço novo (`ConviteService` já existe e
já é injetado em `painel-detalhe.ts` pela issue #22).

**Checkpoint**: Nada bloqueante — ir direto para as user stories.

---

## Phase 3: User Story 1 - Ver o histórico de convites (Priority: P1) 🎯 MVP

**Goal**: Adicionar uma navegação por abas ("Usuários" / "Convites enviados") dentro do modal
"Usuários do painel" já existente, carregando a lista de convites sob demanda na primeira vez que a
aba é aberta.

**Independent Test**: Com um painel que já tem convites em status variados, abrir "Usuários",
clicar na aba "Convites enviados" e verificar que a lista mostra e-mail, papel, status e data de
cada convite.

### Implementation for User Story 1

- [X] T002 [US1] Adicionar em `src/app/features/painel/painel-detalhe/painel-detalhe.ts`: signal
      `usuariosAba = signal<'usuarios' | 'convites'>('usuarios')`, `convites =
      signal<ResponseConviteDto[]>([])`, `convitesCarregados = signal(false)`,
      `carregandoConvites = signal(false)`, `erroConvites = signal<string | undefined>(undefined)`,
      e o mapeamento `STATUS_INFO: Record<StatusConvite, { label: string; classe: string }>`
      (Pendente/Aceito/Recusado/Expirado/Invalidado — ver `data-model.md`), importando
      `ResponseConviteDto`/`StatusConvite` de `core/models/convite.model.ts`
- [X] T003 [US1] Implementar `abrirAbaModal(aba: 'usuarios' | 'convites')` em `painel-detalhe.ts`:
      atualiza `usuariosAba`; se `aba === 'convites'` e `convitesCarregados()` for `false`, chama
      `carregarConvites()` (research.md, Decisão 2 — lazy load)
- [X] T004 [US1] Implementar `carregarConvites()` (privado) em `painel-detalhe.ts`: chama
      `conviteService.listarConvites(painel.id)`, popula `convites`/`convitesCarregados` em caso de
      sucesso, popula `erroConvites` em caso de falha, sempre atualizando `carregandoConvites`
      (FR-002, FR-008, FR-009)
- [X] T005 [US1] Resetar `usuariosAba` para `'usuarios'` ao fechar o modal (`fecharUsuarios()`, já
      existente em `painel-detalhe.ts`) — próxima abertura sempre começa na aba "Usuários"
- [X] T006 [US1] Adicionar a `tab-row` ("Usuários" / "Convites enviados") dentro do bloco
      `@if (usuariosAberto())` de `src/app/features/painel/painel-detalhe/painel-detalhe.html`,
      logo após o `hint-note` do bloco de adicionar e antes do `section-label`/`user-list`
      existentes — clique chama `abrirAbaModal(...)` (FR-001)
- [X] T007 [US1] Envolver o `section-label`+`user-list` existentes (aba "Usuários") em
      `@if (usuariosAba() === 'usuarios')` no mesmo template, e adicionar o novo bloco
      `@if (usuariosAba() === 'convites')` com os estados carregando/erro/vazio/lista (e-mail,
      papel via `papelInfo()` já existente, badge de status via `STATUS_INFO`, data de envio) —
      seguindo o artboard aprovado (FR-002, FR-008, FR-009)
- [X] T008 [US1] Adicionar os estilos da tab-row e da lista de convites (`.tab-row`, `.tab`,
      `.invite-list`, `.invite-row-item`, `.status-pill` por status) em
      `src/app/features/painel/painel-detalhe/painel-detalhe.scss` — implementação nova, não há
      nada reaproveitável (research.md, Decisão 1), mas seguindo os mesmos tokens de cor já usados
      no resto do arquivo (`--accent`, `--teal`, `--danger`, `--ink-faint`)

**Checkpoint**: User Story 1 completa e testável de forma independente.

---

## Phase 4: User Story 2 - Reenviar um convite (Priority: P2)

**Goal**: Botão "Reenviar" nas linhas com status Recusado/Expirado/Invalidado, disparando um novo
convite para o mesmo e-mail/papel e recarregando a lista.

**Independent Test**: Com um convite Recusado ou Expirado visível na aba, clicar "Reenviar" e
verificar que um novo `POST /api/painel/{id}/convites` é disparado com o mesmo e-mail/papel, e que
a lista é recarregada ao final.

### Implementation for User Story 2

- [X] T009 [US2] Adicionar `reenviandoConviteId = signal<string | undefined>(undefined)` em
      `painel-detalhe.ts` (research.md, Decisão 3 — estado por linha, não global)
- [X] T010 [US2] Implementar `podeReenviar(status: StatusConvite): boolean` em `painel-detalhe.ts`,
      retornando `true` para `Recusado`, `Expirado` e `Invalidado` (FR-004)
- [X] T011 [US2] Implementar `reenviarConvite(convite: ResponseConviteDto)` em `painel-detalhe.ts`:
      seta `reenviandoConviteId`, chama `conviteService.criarConvite(painel.id, { email:
      convite.emailConvidado, permissao: convite.permissao, urlFrontend })` (mesmo `urlFrontend` já
      usado em `adicionarUsuario()`), e em caso de sucesso recarrega a lista via
      `carregarConvites()` (não faz merge/append manual — FR-005, FR-006); trata erro exibindo
      `erroConvites` sem descartar a lista já carregada (FR-009); sempre limpa
      `reenviandoConviteId` ao final (`finalize`)
- [X] T012 [US2] Adicionar o botão "Reenviar" em cada linha do bloco de convites de
      `painel-detalhe.html` (T007), visível apenas quando `podeReenviar(convite.status)` for
      verdadeiro, com `[disabled]` e spinner enquanto `reenviandoConviteId() === convite.id`
      (FR-004, FR-007)

**Checkpoint**: US1 e US2 completas — histórico de convites funcional de ponta a ponta dentro do
modal "Usuários do painel".

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T013 [P] Confirmar foco visível (`:focus-visible`) e `aria-label`/texto acessível nos novos
      controles (tabs, botão "Reenviar") em `painel-detalhe.html`
- [X] T014 [P] Rodar `ng test` e confirmar que os specs existentes continuam passando sem alteração
      de comportamento fora do escopo desta feature
- [ ] T015 Executar manualmente os 3 cenários de
      `specs/003-historico-convites-usuarios/quickstart.md` contra `api-dashfinras` local
- [X] T016 Confirmar que a aba "Usuários" (issue #22) continua funcionando exatamente como antes —
      regressão explícita do quickstart

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências
- **Foundational (Phase 2)**: Vazia
- **User Stories (Phase 3-4)**: US1 (T002-T008) é pré-requisito estrutural de US2 (T009-T012) — US2
  reenvia um convite que só existe visível depois que US1 criou a lista/tab
- **Polish (Phase 5)**: Depende de US1 e US2 completas

### Parallel Opportunities

- T013 e T014 (Polish) podem rodar em paralelo
- Dentro de US1, T002 (estado) e T008 (estilos) podem ser feitas em paralelo até convergirem no
  template (T006/T007)

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1 — visibilidade do histórico já entrega valor sozinha
3. **PARAR e VALIDAR**: Cenário 1 do quickstart
4. Completar Phase 4: User Story 2 — fecha o ciclo "ver + reenviar"

### Incremental Delivery

1. Setup → nenhuma base a preparar
2. US1 → testar independentemente (histórico visível, lazy load funcionando)
3. US2 → testar independentemente (reenvio, estado por linha)
4. Cada story soma valor sem quebrar a anterior

## Notes

- Nenhuma tarefa de teste automatizado foi gerada (não solicitado no spec)
- Nenhum DTO/endpoint novo — reaproveita `ConviteService` já injetado em `painel-detalhe.ts`
  (issue #22)
- Estilos de status/lista são implementação nova (research.md, Decisão 1) — não há CSS
  reaproveitável de tentativas anteriores
- Commit após cada tarefa ou grupo lógico
