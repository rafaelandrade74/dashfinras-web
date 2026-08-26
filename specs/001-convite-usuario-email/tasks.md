---

description: "Task list template for feature implementation"
---

# Tasks: Convite de usuário por e-mail

**Input**: Design documents from `specs/001-convite-usuario-email/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/convite-api.md, quickstart.md

**Tests**: Não solicitados explicitamente no spec — nenhuma tarefa de teste automatizado formal foi
gerada; a validação é feita pelos cenários manuais de `quickstart.md` (Polish, T032) e pelos specs
`ng test` já existentes no padrão do projeto (regressão coberta na Polish phase).

**Organization**: Tarefas agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual user story a tarefa pertence (US1, US2, US3, US4)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único Angular (ver `plan.md` › Project Structure): `src/app/core/`, `src/app/features/painel/`,
novo `src/app/features/convite/`, `src/app/app-routing-module.ts`.

---

## Phase 1: Setup

**Purpose**: Nenhuma inicialização de projeto é necessária — `dashfinras-web` já está configurado
(Angular, Prettier, testes). Esta fase só confirma o ambiente antes de codar.

- [ ] T001 Confirmar que `npm run start:dev` sobe UI + BFF localmente e que `api-dashfinras` local
      expõe os endpoints de `specs/001-convite-usuario-email/contracts/convite-api.md` (pré-requisito
      manual, sem arquivo de código)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelos e serviço compartilhados por todas as user stories — nenhuma story pode ser
implementada antes desta fase.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 [P] Criar `StatusConvite`, `RequestCriarConviteDto`, `ResponseConviteDto` e
      `ResponseConvitesDto` em `src/app/core/models/convite.model.ts`, reaproveitando `PainelPermissao`
      de `src/app/core/models/painel.model.ts` (ver `data-model.md`); confirmar contra a API local os
      valores reais de `StatusConvite` e o(s) campo(s) de "quem convidou" em `ResponseConviteDto`
      antes de fixar os tipos
- [X] T003 [P] Criar `ConviteService` em `src/app/core/services/convite.service.ts` com
      `criarConvite(idPainel, dto)`, `listarConvites(idPainel)`, `obterConvitePorToken(token)`,
      `aprovarConvite(token)`, `recusarConvite(token)`, no mesmo padrão de
      `src/app/core/services/painel.service.ts` (ver `contracts/convite-api.md`)

**Checkpoint**: Modelos e serviço prontos — as user stories podem começar.

---

## Phase 3: User Story 1 - Convidar usuário por e-mail ao criar um painel (Priority: P1) 🎯 MVP

**Goal**: Permitir adicionar e-mails + papel a uma lista de pendentes no modal "Novo painel" e
disparar um convite por e-mail pendente ao confirmar a criação do painel.

**Independent Test**: Criar um painel novo, adicionar um e-mail com papel "Membro" à lista antes de
salvar, confirmar a criação e verificar (via rede/API) que o painel foi criado e que
`POST /api/painel/{id}/convites` foi chamado para aquele e-mail.

### Implementation for User Story 1

- [X] T004 [US1] Adicionar estado local de pendentes (`signal<ConvitePendente[]>`) e métodos
      `adicionarPendente`/`removerPendente` com validação de formato de e-mail (FR-002), duplicidade
      (FR-003) e e-mail do próprio usuário logado (FR-004) em
      `src/app/features/painel/painel-criar/painel-criar.ts`
- [X] T005 [US1] Adicionar a seção "Usuários (opcional)" (campo e-mail + select de papel, botão
      adicionar, lista de pendentes com chip de papel e botão remover) em
      `src/app/features/painel/painel-criar/painel-criar.html`, seguindo o artboard 01 aprovado
- [X] T006 [US1] Adicionar os estilos da seção "Usuários (opcional)" (`.section-users`,
      `.invite-row`, `.pending-list`, `.role-chip`, `.hint-note`) em
      `src/app/features/painel/painel-criar/painel-criar.scss`, reaproveitando os tokens de cor/tipografia
      já definidos em `:host` (paper/ink/accent/teal/danger)
- [X] T007 [US1] Alterar `salvar()` em `src/app/features/painel/painel-criar/painel-criar.ts` para,
      após `adicionarPainel` retornar com sucesso, disparar em paralelo (`forkJoin`) um
      `ConviteService.criarConvite(painelId, { email, permissao, urlFrontend })` por e-mail pendente,
      montando `urlFrontend` a partir da origem do app + `/convites` (FR-006, FR-007, research.md
      Decisão 1)
- [X] T008 [US1] Tratar falha parcial de convites em `painel-criar.ts`: navegar para `/paineis`
      mesmo se algum convite falhar, exibindo um aviso com os e-mails que falharam e a sugestão de
      reenviar pela aba "Convites enviados" (FR-021, research.md Decisão 3)

**Checkpoint**: User Story 1 completa e testável de forma independente.

---

## Phase 4: User Story 2 - Responder a um convite recebido por e-mail (Priority: P1)

**Goal**: Página pública `/convites/:token` mostrando painel, quem convidou e papel oferecido, com
ações Aceitar/Recusar, tratando convite expirado/inválido/já respondido e exigindo login apenas na
hora de decidir.

**Independent Test**: Acessar o link de um convite pendente (autenticado e não autenticado) e
confirmar que os dados aparecem corretamente e que os botões Aceitar/Recusar funcionam; acessar um
token expirado e um token inválido e confirmar as mensagens correspondentes.

### Implementation for User Story 2

- [X] T009 [US2] Criar o módulo lazy `src/app/features/convite/convite-module.ts` e
      `src/app/features/convite/convite-routing-module.ts` com a rota `''` apontando para o novo
      componente `ConviteResponder`
- [X] T010 [US2] Adicionar a rota pública `/convites/:token` em `src/app/app-routing-module.ts`
      apontando para `ConviteModule` (lazy), **sem** `authGuard`/`accountGuard` (research.md Decisão 2)
- [X] T011 [US2] Criar `src/app/features/convite/convite-responder/convite-responder.ts`: no
      `ngOnInit`, ler `token` da rota e chamar `ConviteService.obterConvitePorToken`; expor signals de
      `convite`, `carregando` e `erro` (token inválido — FR-014); calcular estado derivado (pendente /
      expirado / já respondido) a partir de `status` (FR-012, FR-013)
- [X] T012 [US2] Criar `src/app/features/convite/convite-responder/convite-responder.html` com os
      estados "pendente" (painel, quem convidou, papel, botões Aceitar/Recusar), "expirado" e
      "inválido", seguindo os artboards 02 aprovados
- [X] T013 [US2] Criar `src/app/features/convite/convite-responder/convite-responder.scss`
      reaproveitando a paleta/tipografia (`--paper`, `--ink`, `--accent`, `--teal`, `--danger`,
      IBM Plex Sans/Fraunces) já usada em `painel-criar.scss`
- [X] T014 [US2] Implementar o clique em Aceitar/Recusar em `convite-responder.ts`: se
      `AuthService`/`waitUntilReady()` indicar usuário não autenticado, redirecionar para
      `/login?redirectUrl=/convites/{token}` (reaproveitando o padrão de `authGuard`) antes de permitir
      a ação (FR-009)

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente.

---

## Phase 5: User Story 3 - Ver confirmação da decisão do convite (Priority: P2)

**Goal**: Telas de confirmação "convite aceito" (com link para o painel) e "convite recusado" após
a decisão, com tratamento de erro de comunicação permitindo nova tentativa.

**Independent Test**: A partir de um convite pendente, clicar em Aceitar e verificar a tela de
sucesso com link para o painel; clicar em Recusar em outro convite e verificar a tela de recusa;
simular falha de rede e verificar que a pessoa pode tentar novamente sem perder o contexto.

### Implementation for User Story 3

- [X] T015 [US3] Chamar `ConviteService.aprovarConvite(token)`/`recusarConvite(token)` a partir dos
      handlers criados em T014 (`convite-responder.ts`), atualizando um signal de `decisao`
      (`'aceito' | 'recusado' | undefined`) ao concluir com sucesso (FR-010, FR-011)
- [X] T016 [US3] Adicionar os estados visuais "Convite aceito" (com link para `/paineis/{idPainel}`)
      e "Convite recusado" em `convite-responder.html`, seguindo os artboards 03 aprovados (FR-015,
      FR-016)
- [X] T017 [US3] Tratar erro de comunicação ao aprovar/recusar em `convite-responder.ts`: manter o
      estado "pendente" visível com uma mensagem de erro e permitir nova tentativa sem recarregar o
      convite do zero (FR-021)

**Checkpoint**: User Stories 1, 2 e 3 funcionam de forma independente.

---

## Phase 6: User Story 4 - Acompanhar convites enviados por um painel (Priority: P2)

**Goal**: Aba "Convites enviados" na tela de detalhe do painel, visível só para o dono, listando
e-mail/papel/status/data de cada convite retornado pela API, com opção de reenviar convites
Recusados/Expirados e estado vazio quando não há convites.

**Independent Test**: Com um painel que já tem convites em status variados, abrir a aba "Convites
enviados" e verificar que a lista bate com o retorno de `GET /api/painel/{id}/convites`; confirmar
que a aba não aparece para quem não é dono; acionar "Reenviar" em um convite Recusado/Expirado e
verificar que a lista é recarregada.

### Implementation for User Story 4

- [X] T018 [US4] Adicionar signals `convites`, `carregandoConvites`, `erroConvites` e `abaAtiva`
      (`'transacoes' | 'convites'`) em
      `src/app/features/painel/painel-detalhe/painel-detalhe.ts`, carregando a lista via
      `ConviteService.listarConvites(painel.id)` somente quando `podeExcluir` (dono, já existente em
      `painel-detalhe.ts`) for verdadeiro (FR-017)
- [X] T019 [US4] Adicionar a navegação por abas ("Entradas e saídas" / "Convites enviados", esta
      última só para o dono) e a tabela de convites (e-mail, papel, badge de status, data de envio,
      botão de reenviar em linhas Recusado/Expirado) em
      `src/app/features/painel/painel-detalhe/painel-detalhe.html`, seguindo o artboard 04 aprovado
      (FR-018)
- [X] T020 [US4] Adicionar estado vazio ("nenhum convite enviado ainda") quando `convites()` estiver
      vazio, na mesma seção de `painel-detalhe.html` (FR-020)
- [X] T021 [US4] Adicionar os estilos da aba/tabela de convites (`.tab-row`, `.invite-table`,
      `.status-badge` por status, `.approve-note`) em
      `src/app/features/painel/painel-detalhe/painel-detalhe.scss`, reaproveitando os tokens de cor já
      usados no restante do componente
- [X] T022 [US4] Implementar `reenviarConvite(convite)` em `painel-detalhe.ts`: chama
      `ConviteService.criarConvite` com o mesmo e-mail/papel do convite selecionado e, ao concluir,
      recarrega a lista via `listarConvites` — sem nenhuma lógica de merge/dedup client-side
      (FR-019, Clarifications sessão 2026-08-25)

**Checkpoint**: Todas as 4 user stories funcionam de forma independente.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta, acessibilidade e regressão.

- [X] T023 [P] Confirmar foco visível (`:focus-visible`) e `aria-label` nos novos controles
      interativos (botão adicionar/remover pendente, tabs, botão reenviar, botões Aceitar/Recusar) em
      `painel-criar.html`, `convite-responder.html` e `painel-detalhe.html`
- [X] T024 [P] Rodar `ng test` e confirmar que os specs existentes (`painel-list.spec.ts`, etc.)
      continuam passando sem alteração de comportamento fora do escopo desta feature
- [ ] T025 Executar manualmente os 6 cenários de `specs/001-convite-usuario-email/quickstart.md`
      contra `api-dashfinras` local, registrando qualquer divergência de contrato encontrada (ex.:
      valores reais de `StatusConvite`, campo de "quem convidou") de volta em `data-model.md`
- [X] T026 Verificar a regressão explícita do quickstart: criar painel **sem** nenhum e-mail na
      lista de pendentes não deve disparar nenhuma chamada a `/convites` (FR-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEIA todas as user stories
- **User Stories (Phase 3-6)**: Todas dependem da Foundational
  - US1 (T004-T008) e US4 (T018-T022) são independentes entre si e de US2/US3
  - US2 (T009-T014) é pré-requisito estrutural de US3 (T015-T017), que estende o mesmo componente
    `ConviteResponder` — US3 não pode começar antes de US2 criar o componente
- **Polish (Phase 7)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **User Story 1 (P1)**: Após Foundational — sem dependência de outras stories
- **User Story 2 (P1)**: Após Foundational — sem dependência de outras stories
- **User Story 3 (P2)**: Após Foundational **e** após US2 (reaproveita o componente `ConviteResponder`
  criado em T009-T013)
- **User Story 4 (P2)**: Após Foundational — sem dependência de outras stories (mas faz mais sentido
  testar depois de US1 existir, para já ter convites reais para listar)

### Within Each User Story

- Modelo/serviço (Foundational) antes de qualquer UI
- Estado/lógica do componente antes do template que o consome
- Estilos podem ser feitos em paralelo ao template correspondente

### Parallel Opportunities

- T002 e T003 (Foundational) podem rodar em paralelo — arquivos diferentes
- Após Foundational: US1 (T004-T008) e US4 (T018-T022) podem ser feitas em paralelo por
  desenvolvedores diferentes; US2 (T009-T014) também é paralela a ambas
- T023 e T024 (Polish) podem rodar em paralelo

---

## Parallel Example: Foundational

```bash
Task: "Criar StatusConvite, RequestCriarConviteDto, ResponseConviteDto e ResponseConvitesDto em src/app/core/models/convite.model.ts"
Task: "Criar ConviteService em src/app/core/services/convite.service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueia tudo)
3. Completar Phase 3: User Story 1 (convidar ao criar painel)
4. Completar Phase 4: User Story 2 (responder ao convite)
5. **PARAR e VALIDAR**: rodar o Cenário 1 e 2 de `quickstart.md` ponta a ponta
6. US1+US2 já entregam o ciclo completo "convidar → aceitar"; US3 e US4 refinam a experiência

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 → testar independentemente (convite disparado corretamente)
3. US2 → testar independentemente (convite pode ser visualizado e decidido)
4. US3 → testar independentemente (confirmação clara da decisão)
5. US4 → testar independentemente (dono acompanha e reenvia convites)
6. Cada story soma valor sem quebrar as anteriores

## Notes

- [P] = arquivos diferentes, sem dependência
- [Story] mapeia a tarefa à user story correspondente para rastreabilidade
- Nenhuma tarefa de teste automatizado foi gerada (não solicitado no spec) — validação via
  `quickstart.md` (T025) e regressão dos specs existentes (T024)
- Confirmar contra a API local os pontos sinalizados em `data-model.md`/`contracts/convite-api.md`
  (valores de `StatusConvite`, campo de "quem convidou", distinção token inválido vs. expirado) antes
  de considerar T002/T011 fechadas
- Commit após cada tarefa ou grupo lógico
- Parar em qualquer checkpoint para validar a story isoladamente
