# Data Model: Nomes de tags para usuários convidados em painel compartilhado

Nenhuma entidade nova nem migração de schema — a feature reaproveita relacionamentos existentes.

## Entidades envolvidas (sem alteração de shape)

### Tag (`api-dashfinras`)
- `Id: Guid`
- `IdUsuario: Guid` — dono/criador da tag (inalterado)
- `Nome: string`
- `CriadoEm: DateTime`

### MovimentacaoFinanceiraTag (join N:N, já existente)
- `IdMovimentacaoFinanceira: Guid`
- `IdTag: Guid`

### MovimentacaoFinanceira (relevante)
- `IdPainel: Guid` — usado como ponte para escopar tags por painel

## Nova consulta (não nova tabela)

`GetTagsPorPainelAsync(idUsuario: Guid, idPainel: Guid): ICollection<Tag>`

1. Valida `PaineisUsuarios.Any(idUsuario, idPainel)` — 403/404 se o usuário não pertence ao painel.
2. `Tags` que têm pelo menos um `MovimentacaoFinanceiraTag` ligado a uma `MovimentacaoFinanceira`
   com `IdPainel == idPainel` (distinct por `Tag.Id`).

## Frontend (`dashfinras-web`) — sem novo model

`TagDto`/`ResponseTagDto` inalterados. `TagService.listar(idPainel?: string)` passa a aceitar um
parâmetro opcional de painel, repassado como query string para `GET /api/tag`.
