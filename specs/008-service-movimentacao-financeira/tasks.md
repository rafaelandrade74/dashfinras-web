---

description: "Task list template for feature implementation"
---

# Tasks: Service e models de movimentações financeiras

**Input**: Design documents from `specs/008-service-movimentacao-financeira/`

**Prerequisites**: plan.md, spec.md

**Status**: Todas as tarefas abaixo já foram concluídas e entregues no commit `5b9d99a`
("[DFW-1] feat(movimentacoes): adiciona models e service de movimentacoes financeiras").
Este documento é uma reconstrução retroativa da decomposição de tarefas, para manter o
histórico formal do processo Spec Kit consistente com as demais features do repositório.

**Tests**: Testes unitários solicitados e entregues junto com a implementação
(`movimentacao-financeira.service.spec.ts`), cobrindo sucesso e erro dos seis métodos do
service — ver FR-010 em `spec.md`.

**Organization**: Feature única (User Story 1 de `spec.md`) — sem múltiplas user stories,
por ser uma entrega de infraestrutura de dados sem UI.

## Format: `[ID] [P?] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa
  incompleta)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único Angular. Toda a feature vive em `src/app/core/models/` e
`src/app/core/services/` — nenhum arquivo novo fora dali (ver `plan.md` › Structure
Decision).

---

## Phase 1: Setup

Nenhuma inicialização necessária — projeto já configurado, padrão de
`painel.service.ts`/`convite.service.ts` já estabelecido e disponível como referência.

- [X] T001 Confirmar os DTOs equivalentes já expostos pela `api-dashfinras` (modelo de
      movimentações financeiras, PR #39 daquele repositório) para garantir fidelidade dos
      models TS aos DTOs C# (pré-requisito manual, sem arquivo de código neste repo)

---

## Phase 2: Models

- [X] T002 [P] Criar `src/app/core/models/movimentacao-financeira.model.ts` com os enums
      `TipoMovimentacao` (`Despesa = 0`, `Receita = 1`) e `StatusMovimentacao`
      (`Pendente = 0`, `Pago = 1`) (FR-008)
- [X] T003 [P] Adicionar a interface `TagDto` (`id`, `idUsuario?`, `nome`, `criadoEm?`) em
      `movimentacao-financeira.model.ts` (FR-009)
- [X] T004 [P] Adicionar a interface `ResponseMovimentacaoDto` (id, idPainel, tipo,
      idCategoria, competencia, valor, status, dataPagamento?, observacao?, ativo,
      dataCancelamento?, criadoPor, criadoEm, alteradoPor?, alteradoEm?, tags?) em
      `movimentacao-financeira.model.ts` (FR-009)
- [X] T005 [P] Adicionar as interfaces `RequestRegistrarMovimentacaoDto`,
      `RequestMarcarComoPagoDto` e `RequestAssociarTagsDto` em
      `movimentacao-financeira.model.ts` (FR-009)
- [X] T006 [P] Adicionar as interfaces `GetMovimentacaoFiltroDto` (todos os campos
      opcionais: idPainel, competencia, idCategoria, idTag, status, dataInicio, dataFim) e
      `AgregacaoFinanceiraDto` (competencia, totalReceitas, totalDespesas, saldo) em
      `movimentacao-financeira.model.ts` (FR-009)

**Checkpoint**: Todos os models/DTOs disponíveis para o service consumir.

---

## Phase 3: Service

- [X] T007 Criar `src/app/core/services/movimentacao-financeira.service.ts` com
      `@Injectable({ providedIn: 'root' })`, `HttpClient` injetado via construtor e
      `baseUrl = ${environment.apiUrl}/movimentacoes-financeiras` (FR-001)
- [X] T008 Implementar `registrar(dto: RequestRegistrarMovimentacaoDto):
      Observable<ResponseMovimentacaoDto>` (`POST` na `baseUrl`) (FR-002)
- [X] T009 Implementar `marcarComoPago(id: string, dataPagamento: string):
      Observable<ResponseMovimentacaoDto>` (`PUT {baseUrl}/{id}/marcar-como-pago`) (FR-003)
- [X] T010 Implementar `associarTags(id: string, idsTags: string[]): Observable<void>`
      (`PUT {baseUrl}/{id}/tags`) (FR-004)
- [X] T011 Implementar `cancelar(id: string): Observable<void>` (`DELETE {baseUrl}/{id}`)
      (FR-005)
- [X] T012 Implementar `consultar(filtro: GetMovimentacaoFiltroDto):
      Observable<ResponseMovimentacaoDto[]>` (`GET` na `baseUrl`, montando `HttpParams` a
      partir dos campos definidos do filtro) (FR-006)
- [X] T013 Implementar `obterAgregacao(competencia: number, idPainel?: string):
      Observable<AgregacaoFinanceiraDto>` (`GET {baseUrl}/agregacao`, `competencia`
      sempre presente, `idPainel` apenas quando informado) (FR-007)

**Checkpoint**: Service completo, expondo os seis métodos sobre `/movimentacoes-financeiras`.

---

## Phase 4: Testes e Polish

- [X] T014 Criar `src/app/core/services/movimentacao-financeira.service.spec.ts` cobrindo
      caso de sucesso e caso de erro para cada um dos seis métodos (`registrar`,
      `marcarComoPago`, `associarTags`, `cancelar`, `consultar`, `obterAgregacao`), com
      `HttpTestingController`, no mesmo padrão de
      `painel.service.spec.ts`/`convite.service.spec.ts` (FR-010, SC-002)
- [X] T015 [P] Confirmar em teste que `consultar()` omite da query string qualquer campo
      `undefined`/`null` do filtro, e que `obterAgregacao()` omite `idPainel` quando não
      informado (Edge Cases de `spec.md`)
- [X] T016 Rodar `ng test` e confirmar que os specs existentes do projeto continuam
      passando sem regressão (SC-001, SC-002)

**Checkpoint**: Feature completa — models e service de movimentações financeiras
disponíveis para uso pelas futuras telas do domínio financeiro.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências
- **Models (Phase 2)**: Depende apenas do Setup; T002-T006 podem ser feitas em paralelo
  dentro do mesmo arquivo (mesma tarefa lógica, arquivo único)
- **Service (Phase 3)**: Depende de Phase 2 completa (os DTOs precisam existir antes do
  service importá-los)
- **Testes e Polish (Phase 4)**: Depende de Phase 3 completa

### Parallel Opportunities

- T002-T006 (models) tocam o mesmo arquivo e foram implementadas em sequência dentro dele,
  ainda que logicamente independentes entre si
- T015 pode ser considerada parte de T014 (mesmo arquivo de teste)

---

## Implementation Strategy

Entrega única e atômica (sem MVP incremental por user story): models e service foram
implementados e testados em um único commit, por serem uma unidade coesa e pequena de
infraestrutura de dados, sem valor de negócio observável isoladamente por partes.

## Notes

- Nenhum novo componente/rota — toda a feature vive em `src/app/core/models/` e
  `src/app/core/services/`, seguindo exatamente o padrão de `painel.service.ts`/
  `convite.service.ts` (ver `plan.md` › Decisões de design)
- Implementação, testes e commit únicos: `5b9d99a`
- Este `tasks.md`, junto com `spec.md` e `plan.md` desta pasta, é uma documentação
  retroativa gerada após a implementação (task de documentação, não de código) —
  nenhuma tarefa aqui exige nova alteração de código
