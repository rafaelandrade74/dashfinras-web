# Research: Nomes de tags para usuários convidados em painel compartilhado

## Decisão 1: Como escopar tags por painel sem alterar a entidade `Tag`

**Decision**: Adicionar uma consulta que resolve tags **a partir dos lançamentos do painel**, via
join `MovimentacoesFinanceiras` → `MovimentacoesFinanceirasTags` → `Tags`, filtrando por
`IdPainel` (com o mesmo controle de acesso via `PaineisUsuarios` já usado em
`MovimentacaoFinanceiraRepository`). Não adiciona `IdPainel` à tabela `Tags`.

**Rationale**: `Tag` hoje é 1:N com `User` (`IdUsuario`) e N:N com `MovimentacaoFinanceira` via
`MovimentacaoFinanceiraTag`. Um lançamento já pertence a um painel (`MovimentacaoFinanceira.IdPainel`).
Logo "tags relevantes para um painel" = "tags associadas a algum lançamento desse painel" —
dado que já existe na modelagem, sem precisar de migração de schema. Também resolve a User Story 3
da spec de #49 (contexto de filtro) e mantém a tag como um recurso "do usuário que a criou" para
fins de posse/edição futura, só muda a **leitura** para ser por painel.

**Alternatives considered**:
- Adicionar `IdPainel` direto na tabela `Tags` (tag pertence a um painel, não a um usuário) —
  rejeitado por ser uma migração de dados mais invasiva (teria que migrar tags existentes,
  decidir o que fazer com tags sem uso ainda) para resolver um problema que a associação existente
  já resolve.
- Incluir o nome da tag diretamente no DTO de movimentação (`ResponseMovimentacaoDto`), evitando
  o round-trip de `GET /api/tag` — resolveria também, mas é uma mudança maior de contrato da
  listagem principal (issue #49 já mexe nesse endpoint); mantido como alternativa a reavaliar se o
  time preferir consolidar as duas mudanças de contrato juntas.

## Decisão 2: Novo endpoint vs. parâmetro no endpoint existente

**Decision**: Adicionar parâmetro opcional `idPainel` em `GET /api/tag` (em vez de criar um
endpoint novo `/api/tag/painel/{id}`), retornando: sem `idPainel` → tags do usuário (comportamento
atual, ainda usado por outros fluxos como "criar/associar tag" via `resolverIdsPorNome`); com
`idPainel` → tags associadas aos lançamentos desse painel (novo comportamento).

**Rationale**: Menor mudança de contrato — endpoint e DTO de resposta (`ResponseTagsDto`)
permanecem os mesmos, só o filtro muda. `resolverIdsPorNome` (usado ao criar/editar lançamento)
continua chamando `listar()` sem `idPainel`, pois criar uma tag continua sendo uma ação por
usuário.

**Alternatives considered**: Endpoint novo dedicado — mais explícito, mas duplica DTO/rota para um
caso que é essencialmente o mesmo recurso com filtro diferente.

## Decisão 3: Fallback quando a tag não pode ser resolvida

**Decision**: Placeholder textual fixo `"Tag indisponível"` no lugar do GUID, aplicado tanto para
erro de rede quanto para tag ausente no mapa.

**Rationale**: Simplicidade — não é necessário diferenciar as duas causas na UI; ambas resultam em
"não consigo te dizer o nome desta tag agora".

**Alternatives considered**: Ocultar o chip inteiro — rejeitado porque esconde a existência da
tag, dificultando perceber que o lançamento está categorizado.

## Decisão 4: Controle de acesso do novo filtro por painel

**Decision**: Reaproveitar exatamente a checagem já usada em `MovimentacaoFinanceiraRepository`
(`PaineisUsuarios.Where(pu => pu.IdUsuario == idUsuario)`) para validar que o usuário autenticado
pertence ao painel solicitado antes de retornar qualquer tag.

**Rationale**: Consistência com o controle de acesso já estabelecido no domínio de painéis; evita
implementar uma segunda forma de checar pertencimento a painel.

**Alternatives considered**: Nenhuma — é o padrão já estabelecido no código.
