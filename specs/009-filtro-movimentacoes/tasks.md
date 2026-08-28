# Tasks: Barra de filtros de movimentações

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Status**: Todas as tarefas concluídas — entregues no commit `1976fdf` ("[DFW-3] feat: adiciona componente de filtros de movimentacoes (competencia, categoria, status, tags)").

> Documentação retroativa: as tarefas abaixo descrevem, em ordem lógica, o trabalho que já foi implementado nesse commit único, para fins de rastreabilidade do processo Spec Kit.

## Tarefas

- [X] **T001** — Criar a pasta e o esqueleto do componente `app-filtro-movimentacoes` em `src/app/features/painel/filtro-movimentacoes/` (`.ts`, `.html`, `.scss`). *(commit `1976fdf`)*
- [X] **T002** — Definir o contrato `FiltroMovimentacoesDto` (`competencia`, `categoria`, `status`, `tags`) e o tipo `StatusFiltroMovimentacao = 'Pendente' | 'Pago'` em `filtro-movimentacoes.ts`. *(commit `1976fdf`)*
- [X] **T003** — Implementar o estado interno em `signal()` (competência, categoria, status, tags, novaTag) e o `@Output() filtroAlterado`. *(commit `1976fdf`)*
- [X] **T004** — Implementar o campo de competência (input de texto livre) com handler `onCompetenciaChange`, emitindo a cada alteração. *(commit `1976fdf`)*
- [X] **T005** — Implementar o `<select>` de categoria, alimentado por `@Input() categorias: string[]`, com opção "Todas" mapeada para `undefined`. *(commit `1976fdf`)*
- [X] **T006** — Implementar o `<select>` de status (Pendente/Pago/Todos), com "Todos" mapeado para `undefined`. *(commit `1976fdf`)*
- [X] **T007** — Implementar o chips-input de tags: adicionar via Enter (`adicionarTag`), impedir duplicatas e strings vazias, remover via botão dedicado (`removerTag`) e via Backspace no campo vazio (`onTagInputKeydown`). *(commit `1976fdf`)*
- [X] **T008** — Implementar o botão "Limpar filtros" (`limparFiltros`), resetando todos os signals ao estado vazio e emitindo o DTO vazio. *(commit `1976fdf`)*
- [X] **T009** — Estilizar o componente em `filtro-movimentacoes.scss`, reaproveitando os tokens CSS de `painel-detalhe.scss` (`--paper`, `--ink`, `--rule`, `--accent`, `--teal`, etc.) e reproduzindo o layout do esboço aprovado. *(commit `1976fdf`)*
- [X] **T010** — Declarar `FiltroMovimentacoes` em `PainelModule` (`declarations`). *(commit `1976fdf`)*
- [X] **T011** — Escrever testes unitários cobrindo todos os cenários de aceite (estado inicial, competência, categoria com opção "Todas", status com opção "Todos", adicionar/remover tag, tag duplicada, tag vazia, Backspace com/sem texto no campo, limpar filtros) em `filtro-movimentacoes.spec.ts`. *(commit `1976fdf`)*
- [X] **T012** — Rodar a suíte de testes do frontend e validar que todos os testes do componente passam sem quebrar testes existentes. *(commit `1976fdf`)*

## Notas de rastreabilidade

- Todas as tarefas foram entregues em um único commit (`1976fdf`), sem PR intermediário registrado nesta branch até o momento desta documentação retroativa.
- Sem tarefas pendentes de integração com API — a conexão do `filtroAlterado` com a tela de listagem real é escopo da issue DFW-2 (`dfw-2-tela-de-listagem-kpis-tabela-de-lancamentos`), e não deste componente.
