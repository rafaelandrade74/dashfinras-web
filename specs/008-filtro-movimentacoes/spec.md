# Feature Specification: Barra de filtros de movimentações

**Feature Branch**: `[dfw-3-barra-de-filtros-competencia-categoria-status-ta]`

**Created**: 2026-08-27

**Status**: Implemented (documentação retroativa — commit `1976fdf`)

**Input**: Issue DFW-3 — construir o componente de barra de filtros (competência, categoria, status, tags) da tela de listagem de movimentações financeiras de um painel, seguindo exatamente a seção de filtros do esboço aprovado. O componente é isolado e reutilizável, sem integração com API real: apenas emite o estado do filtro para quem o consumir (tela de listagem, entregue separadamente na issue DFW-2).

## Contexto

A listagem de movimentações de um painel (DFW-2) precisa de uma barra de filtros acima da tabela/KPIs para permitir ao usuário restringir os lançamentos exibidos por competência, categoria, status de pagamento e tags livres. Esta entrega cobre exclusivamente o componente de filtro em si — `app-filtro-movimentacoes`, declarado no `PainelModule` — como peça reutilizável e desacoplada da tela que o consome. Não há chamada a API nesta entrega; o componente apenas mantém estado local (signals, app zoneless) e notifica mudanças via `@Output()`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filtrar movimentações por competência, categoria, status e tags (Priority: P1)

Como usuário visualizando as movimentações de um painel, quero um conjunto de campos de filtro (competência, categoria, status, tags) para restringir a lista de lançamentos exibida.

**Why this priority**: É o único objetivo da entrega — sem esses campos funcionando e emitindo o estado corretamente, a tela de listagem (DFW-2) não tem como filtrar nada.

**Independent Test**: Renderizar `app-filtro-movimentacoes` isoladamente (como no `.spec.ts`), alterar cada campo e verificar que o `@Output() filtroAlterado` emite o `FiltroMovimentacoesDto` correto a cada mudança.

**Acceptance Scenarios**:

1. **Given** o componente recém-criado, **When** nenhuma interação ocorreu, **Then** o filtro inicial é vazio: `competencia = ''`, `categoria = undefined`, `status = undefined`, `tags = []`.
2. **Given** o campo de competência, **When** o usuário digita um valor (ex.: `Ago/2026`), **Then** o signal `competencia` é atualizado e `filtroAlterado` emite o DTO com esse valor.
3. **Given** o select de categoria populado via `@Input() categorias: string[]`, **When** o usuário escolhe uma categoria, **Then** `categoria` é atualizado e emitido; **When** escolhe a opção "Todas" (valor vazio), **Then** `categoria` volta a `undefined`.
4. **Given** o select de status com as opções Pendente/Pago/Todos, **When** o usuário escolhe Pendente ou Pago, **Then** `status` é atualizado e emitido como `'Pendente' | 'Pago'`; **When** escolhe "Todos" (valor vazio), **Then** `status` volta a `undefined`.
5. **Given** o campo de tags (chips-input), **When** o usuário digita um texto e pressiona Enter, **Then** a tag é adicionada ao array `tags`, o campo de digitação é limpo e `filtroAlterado` emite o novo estado.
6. **Given** uma tag já presente na lista, **When** o usuário tenta adicionar a mesma tag novamente, **Then** o valor não é duplicado, o campo de digitação é limpo e nenhuma emissão adicional ocorre (nenhuma mudança de estado).
7. **Given** uma tag digitada em branco (string vazia após `trim()`), **When** o usuário pressiona Enter, **Then** nenhuma tag é adicionada e nada é emitido.
8. **Given** uma ou mais tags já adicionadas, **When** o usuário clica no botão "×" de uma tag, **Then** ela é removida do array e o novo estado é emitido.
9. **Given** o campo de digitação de tag vazio e ao menos uma tag já adicionada, **When** o usuário pressiona Backspace, **Then** a última tag adicionada é removida e o novo estado é emitido (atalho de remoção rápida).
10. **Given** o campo de digitação de tag contendo texto, **When** o usuário pressiona Backspace, **Then** nenhuma tag é removida (o Backspace edita o texto normalmente).
11. **Given** qualquer combinação de filtros preenchidos, **When** o usuário clica em "Limpar filtros", **Then** todos os campos (competência, categoria, status, tags, campo de nova tag) voltam ao estado vazio inicial e `filtroAlterado` emite o DTO vazio.

### Edge Cases

- Categorias disponíveis vêm exclusivamente do `@Input() categorias`, fornecido pelo componente pai (tela de listagem); o filtro não busca categorias por conta própria.
- Não há debounce no campo de competência nem no de tags — cada tecla no campo de competência emite imediatamente; a tag só é confirmada (e emitida) em Enter, clique no "×" ou Backspace no campo vazio.
- O componente não valida formato da competência (ex.: `Ago/2026`); é um campo de texto livre com placeholder ilustrativo.
- Sem integração com API: o consumo do evento `filtroAlterado` (chamada ao backend, atualização da tabela) é responsabilidade da tela de listagem (DFW-2), fora do escopo deste componente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O componente DEVE expor um campo de texto livre para competência (`competencia: string`), sem máscara/validação, com placeholder de exemplo (`Ago/2026`).
- **FR-002**: O componente DEVE expor um `<select>` de categoria populado a partir do `@Input() categorias: string[]`, com opção "Todas" mapeada para `categoria = undefined`.
- **FR-003**: O componente DEVE expor um `<select>` de status com as opções Pendente, Pago e "Todos" (mapeada para `status = undefined`).
- **FR-004**: O componente DEVE expor um campo de tags no estilo chips-input, permitindo adicionar tags via Enter e remover via botão dedicado ou via Backspace no campo vazio, sem permitir duplicatas.
- **FR-005**: O componente DEVE expor um botão "Limpar filtros" que reseta todos os campos ao estado inicial vazio.
- **FR-006**: O componente DEVE emitir `@Output() filtroAlterado: EventEmitter<FiltroMovimentacoesDto>` a cada mudança efetiva de estado (competência, categoria, status, tags adicionadas/removidas, ou limpeza) — tentativas sem efeito (tag duplicada, tag vazia) não emitem.
- **FR-007**: O estado interno DEVE ser mantido em `signal()` (compatível com aplicação zoneless), sem uso de `FormGroup`/Reactive Forms.
- **FR-008**: O componente DEVE ser declarado no `PainelModule` como `declarations`, seguindo o padrão não-standalone já usado pelos demais componentes do módulo (`standalone: false`).
- **FR-009**: O componente NÃO integra com nenhuma API — é puramente de apresentação/estado local, consumido por outro componente (tela de listagem, DFW-2) via binding do `@Output()`.

## Success Criteria *(mandatory)*

- **SC-001**: Todos os cenários de aceite acima são cobertos por testes unitários em `filtro-movimentacoes.spec.ts` (203 linhas), rodando via xUnit-equivalente do frontend (Vitest/Angular Testing).
- **SC-002**: A UI do componente reproduz fielmente a seção de filtros do esboço aprovado (mesma disposição de campos, mesmos tokens visuais de `painel-detalhe.scss`).
- **SC-003**: Nenhuma chamada de rede é disparada pelo componente em nenhum cenário.
