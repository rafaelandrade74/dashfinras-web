# Tasks: Nomes de tags para usuários convidados em painel compartilhado

**Input**: Design documents from `specs/010-tags-painel-compartilhado/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tag-por-painel.md, quickstart.md

**Escopo deste worktree**: apenas `dashfinras-web` (frontend). As tarefas de backend
(`api-dashfinras`, `GET /api/tag?idPainel=`) estão listadas para rastreabilidade da spec, mas
**não são implementadas aqui** — outro worktree/sessão é responsável por elas
(`worktrees/api-dashfinras/*`). O `TagService.listar(idPainel?)` deste repo já envia o parâmetro
`idPainel` como query string; um backend antigo que ainda não o suporta simplesmente ignora essa
query string extra e continua respondendo com o escopo atual (por `IdUsuario`), então a mudança do
frontend é segura de mergear independentemente da ordem de entrega dos dois repos.

## Phase 1: Setup

- [X] T001 Nenhuma tarefa de setup necessária — projeto já configurado (Angular/Vitest existentes).

## Phase 2: Foundational

Nenhuma tarefa bloqueante compartilhada entre histórias além do que já existe no repo.

## Phase 3: User Story 2 - Endpoint de tags retorna as tags do painel (Priority: P1) — BACKEND, fora deste worktree

- [ ] T002 [US2] (api-dashfinras, outro worktree) Adicionar parâmetro opcional `idPainel` em
  `GET /api/tag`: `TagController.cs` repassa a query string para `ITagService`.
- [ ] T003 [US2] (api-dashfinras, outro worktree) `TagService`/`ITagService`: novo método
  `ListarPorPainelAsync(idUsuario, idPainel)` que valida pertencimento ao painel
  (`PaineisUsuarios`) antes de delegar ao repositório.
- [ ] T004 [US2] (api-dashfinras, outro worktree) `TagRepository`/`ITagRepository`: nova query
  `GetTagsPorPainelAsync` via join `MovimentacoesFinanceiras` → `MovimentacoesFinanceirasTags` →
  `Tags`, filtrando por `IdPainel`, distinct por `Tag.Id`.
- [ ] T005 [US2] (api-dashfinras, outro worktree) Testes xUnit cobrindo: convidado vê tags de
  outros membros do painel; usuário fora do painel recebe 403/404.

## Phase 4: User Story 1 - Convidado vê o nome da tag, não o GUID (Priority: P1) — FRONTEND

**Goal**: `painel-detalhe` resolve nomes de tag por painel (não mais só por usuário logado),
preparado para consumir `GET /api/tag?idPainel=` assim que o backend suportar o parâmetro.

**Independent Test**: com o backend já aceitando `idPainel`, um convidado abre `painel-detalhe`
de um painel onde o dono criou uma tag e associou a um lançamento; o chip mostra o nome.

- [X] T006 [P] [US1] `TagService.listar()` em
  `src/app/core/services/tag.service.ts` passa a aceitar parâmetro opcional `idPainel: string`,
  repassado como `HttpParams` (`idPainel`) para `GET /api/tag`. Sem o parâmetro, comportamento
  idêntico ao atual (compatibilidade com `resolverIdsPorNome`, que continua chamando `listar()`
  sem argumento).
- [X] T007 [US1] `painel-detalhe.ts`: `carregarTags()` passa a receber o `idPainel` (já disponível
  via `route.snapshot.paramMap.get('id')` em `ngOnInit`) e chamar
  `tagService.listar(idPainel)`.
- [X] T008 [P] [US1] Testes em `tag.service.spec.ts` cobrindo: `listar(idPainel)` envia a query
  string `?idPainel=...`; `listar()` sem argumento continua sem query string (regressão).
- [X] T009 [US1] Teste em `painel-detalhe.spec.ts` cobrindo: `carregarTags()` chama
  `tagService.listar` com o id do painel da rota.

## Phase 5: User Story 3 - Fallback visual não expõe GUID (Priority: P2) — FRONTEND

**Goal**: `tagsLancamento()` nunca retorna o GUID cru, nem em falha de rede nem em tag ausente do
mapa.

**Independent Test**: mockar `TagService.listar()` para falhar (ou retornar uma lista sem a tag
usada em um lançamento) e verificar que `tagsLancamento()` retorna o placeholder fixo, nunca o id.

- [X] T010 [US3] `painel-detalhe.ts`: `tagsLancamento()` troca o fallback `mapa.get(id) ?? id` por
  `mapa.get(id) ?? 'Tag indisponível'` (placeholder textual fixo, conforme research.md Decisão 3).
- [X] T011 [US3] Teste em `painel-detalhe.spec.ts` cobrindo: `idsTags` com id ausente do mapa
  resulta em `'Tag indisponível'` no retorno de `tagsLancamento()`; erro em `carregarTags()`
  (mock retornando erro) também resulta no mesmo placeholder, sem quebrar o resto da tela.

## Phase 6: Polish

- [X] T012 [P] Rodar `npm test` e `npm run build` para confirmar que nada quebrou.

## Dependencies

- Fase 3 (US2, backend) é independente deste worktree — não bloqueia as fases 4/5 aqui, já que
  `TagService.listar(idPainel)` é seguro de enviar mesmo antes do backend suportar o parâmetro
  (query string extra ignorada).
- Fase 4 (US1) depende apenas de T006 (TagService) antes de T007 (painel-detalhe).
- Fase 5 (US3) é independente de US1 — pode ser implementada e testada isoladamente (mock de
  erro/tag ausente não depende do parâmetro `idPainel` estar sendo enviado).

## Parallel Example

```
T006 [P] [US1] TagService.listar(idPainel?)
T008 [P] [US1] Testes de TagService (podem ser escritos em paralelo a T006, mesmo arquivo de teste)
```

## Implementation Strategy

MVP = Fase 5 (US3, fallback) sozinha já elimina o vazamento de GUID como sintoma visível, mesmo
sem o backend aceitar `idPainel` ainda. Fase 4 (US1) é a correção estrutural completa e depende da
entrega do backend (fora deste worktree) para ter efeito pleno — o código do frontend já fica
pronto e é mergeado independentemente.
