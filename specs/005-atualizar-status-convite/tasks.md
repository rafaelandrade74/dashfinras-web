---

description: "Task list template for feature implementation"
---

# Tasks: Atualizar Status de Convite para Novo Formato da API

**Input**: Design documents from `/specs/005-atualizar-status-convite/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos — mudança de mapeamento puro (`statusInfo`/`podeReenviar`), barato e de alto
valor cobrir os 4 novos valores + o caso desconhecido com testes unitários.

**Organization**: Tasks agrupadas por user story (US1, US2) para permitir implementação e teste
independentes, conforme spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: A qual user story a task pertence (US1, US2)
- Caminhos de arquivo exatos incluídos nas descrições

## Path Conventions

Projeto Angular único (`src/app/...`), conforme `plan.md` → Project Structure.

---

## Phase 1: Setup

Nenhuma tarefa de setup necessária — projeto Angular já existe, dependências já instaladas, sem
novo tooling introduzido por esta mudança.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Redefinir o tipo `StatusConvite` para o novo contrato — bloqueia as duas user stories,
pois ambas dependem do tipo/valores atualizados.

**⚠️ CRITICAL**: Nenhuma user story pode ser implementada antes desta fase.

- [X] T001 Substituir `enum StatusConvite` (numérico, 6 valores) por
  `type StatusConvite = 'Pendente' | 'Aprovado' | 'Recusado' | 'Expirado'` em
  `src/app/core/models/convite.model.ts`, mantendo o nome exportado `StatusConvite` e o uso em
  `ResponseConviteDto.status` (ver [data-model.md](./data-model.md) e
  [contracts/convite-status.md](./contracts/convite-status.md))

**Checkpoint**: Tipo atualizado — as duas user stories podem começar.

---

## Phase 3: User Story 1 - Visualizar status correto do convite no histórico (Priority: P1) 🎯 MVP

**Goal**: Cada convite no histórico exibe o rótulo e estilo visual correspondente a um dos 4 novos
status (Pendente, Aprovado, Recusado, Expirado), com fallback seguro para status desconhecido.

**Independent Test**: Abrir o histórico de convites de um painel com convites nos 4 estados (e um
estado desconhecido, se simulado) e conferir rótulo/estilo de cada linha — ver
[quickstart.md](./quickstart.md) Cenário 1 e Cenário 3.

### Tests for User Story 1

- [X] T002 [P] [US1] Criar/expandir `src/app/features/painel/painel-detalhe/painel-detalhe.spec.ts`
  com testes de `statusInfo()` cobrindo os 4 valores (`Pendente`, `Aprovado`, `Recusado`,
  `Expirado`) e um valor desconhecido (fallback neutro), conforme tabela em
  [data-model.md](./data-model.md)

### Implementation for User Story 1

- [X] T003 [US1] Atualizar `STATUS_INFO` em
  `src/app/features/painel/painel-detalhe/painel-detalhe.ts` para o `Record<StatusConvite, ...>`
  com os 4 novos valores e seus rótulos/classes (Pendente→"Pendente"/`status-pendente`,
  Aprovado→"Aprovado"/`status-aceito`, Recusado→"Recusado"/`status-recusado`,
  Expirado→"Expirado"/`status-expirado`), removendo `PendenteCadastro`, `PendenteAprovacao`,
  `Concluido` e `Invalidado` (depende de T001)
- [X] T004 [US1] Adicionar constante de fallback (ex.: `STATUS_DESCONHECIDO = { label: 'Status
  desconhecido', classe: 'status-desconhecido' }`) e atualizar `statusInfo(status)` em
  `painel-detalhe.ts` para retornar esse fallback quando `STATUS_INFO[status]` não existir (FR-006),
  em vez de retornar `undefined` (depende de T003)
- [X] T005 [P] [US1] Adicionar classe visual `.status-desconhecido` em
  `src/app/features/painel/painel-detalhe/painel-detalhe.scss` (estilo neutro, ex.: cinza),
  espelhando as classes `.status-*` já existentes no arquivo

**Checkpoint**: Histórico de convites exibe corretamente os 4 novos status e não quebra diante de
um status desconhecido — testável de forma independente.

---

## Phase 4: User Story 2 - Reenviar convite continua disponível nos estados corretos (Priority: P2)

**Goal**: A ação de reenviar convite aparece apenas para convites Recusados ou Expirados.

**Independent Test**: Abrir o histórico com um convite Recusado e um Expirado e confirmar que a
opção de reenviar aparece para ambos e não aparece para Pendente/Aprovado — ver
[quickstart.md](./quickstart.md) Cenário 2.

### Tests for User Story 2

- [X] T006 [P] [US2] Adicionar testes de `podeReenviar()` em
  `src/app/features/painel/painel-detalhe/painel-detalhe.spec.ts` cobrindo os 4 valores: `true`
  para `Recusado`/`Expirado`, `false` para `Pendente`/`Aprovado`

### Implementation for User Story 2

- [X] T007 [US2] Atualizar `podeReenviar(status)` em `painel-detalhe.ts` para checar apenas
  `status === 'Recusado' || status === 'Expirado'`, removendo a checagem de `StatusConvite.Invalidado`
  (depende de T001)

**Checkpoint**: Ambas user stories funcionam de forma independente — histórico exibe status
corretos (US1) e reenvio aparece apenas nos estados certos (US2).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validar a mudança de ponta a ponta e conferir que não sobrou nenhum resquício do
formato antigo.

- [X] T008 [P] Revisar `src/app/features/painel/painel-detalhe/painel-detalhe.html` para confirmar
  que nenhum binding referencia rótulos/valores antigos (ex.: "Aceito", "Invalidado") — ajustar se
  necessário
- [X] T009 Rodar `npm test -- painel-detalhe` e confirmar que os testes de T002/T006 passam
- [ ] T010 Executar os 3 cenários de [quickstart.md](./quickstart.md) manualmente (`npm run
  start:dev`) contra a API já atualizada, incluindo o Cenário 3 (status desconhecido)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Sem dependências além do estado atual do repo — BLOQUEIA as duas user
  stories (T001 precisa terminar antes de T003/T004/T007)
- **User Story 1 (Phase 3)**: Depende de T001. Sem dependência de US2.
- **User Story 2 (Phase 4)**: Depende de T001. Independente de US1 (arquivo compartilhado
  `painel-detalhe.ts`, mas funções distintas — sem conflito lógico; se um único dev fizer as duas,
  pode implementar T003/T004 e T007 na mesma sessão de edição do arquivo)
- **Polish (Phase 5)**: Depende de US1 e US2 completas

### Parallel Opportunities

- T002 (teste US1) pode ser escrito em paralelo a T005 (SCSS), ambos antes/durante a implementação
  de T003/T004
- T006 (teste US2) é independente de toda a Phase 3 — pode ser feito em paralelo por outro
  desenvolvedor assim que T001 estiver pronto
- T005 (SCSS) é paralelo a T003/T004 (arquivos diferentes)

---

## Parallel Example: Após Foundational (T001)

```bash
# Duas pessoas podem trabalhar em paralelo assim que T001 (tipo StatusConvite) estiver pronto:
Task: "US1 — atualizar STATUS_INFO e statusInfo() com fallback em painel-detalhe.ts (T003, T004)"
Task: "US2 — atualizar podeReenviar() em painel-detalhe.ts (T007)"
# (mesmo arquivo — coordenar merge se forem devs diferentes; senão, sequencial é mais simples)
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 2: Foundational (T001)
2. Completar Phase 3: User Story 1 (T002–T005)
3. **PARAR e VALIDAR**: histórico de convites exibe os 4 status corretamente e trata status
   desconhecido sem quebrar
4. US2 (reenvio) pode ficar temporariamente com a lógica antiga só se a API ainda aceitar
   `Invalidado` — como este é um ajuste pequeno e as duas stories tocam o mesmo arquivo, o caminho
   recomendado é implementar ambas na mesma PR (ver Incremental Delivery abaixo)

### Incremental Delivery

1. Foundational (T001) → tipo pronto
2. US1 (T002–T005) → histórico exibe status certos → validar
3. US2 (T006–T007) → reenvio disponível nos estados certos → validar
4. Polish (T008–T010) → revisão final + validação de ponta a ponta

## Notes

- [P] tasks = arquivos diferentes ou sem dependência de tasks incompletas
- Verificar que os testes (T002, T006) falham antes de aplicar a implementação correspondente
  (T003/T004, T007), depois passam
- Fazer commit após cada task ou grupo lógico
- Como o escopo é pequeno (1 model + 1 componente), é razoável implementar US1 e US2 na mesma PR —
  a separação em stories serve para tornar a validação e o teste incrementais, não necessariamente
  para forçar PRs separados
