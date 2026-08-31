# Implementation Plan: Nomes de tags para usuários convidados em painel compartilhado

**Branch**: `010-tags-painel-compartilhado` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-tags-painel-compartilhado/spec.md`

## Summary

`GET /api/tag` (backend `api-dashfinras`) é escopado por `IdUsuario` na tabela `Tags` — confirmado
em `TagRepository.GetAllAsync`/`Tag.cs` (não existe nenhuma coluna/relacionamento de painel na
entidade `Tag`, só `IdUsuario`). Um convidado de painel que não é dono das tags usadas nos
lançamentos nunca recebe essas tags nesse endpoint, então o `Map` de resolução de nome em
`painel-detalhe.ts` fica incompleto e o fallback expõe o GUID cru.

Abordagem: introduzir uma forma de o backend responder "quais tags são relevantes para este
painel" (não "quais tags este usuário criou"), reaproveitando a associação já existente
`MovimentacaoFinanceiraTag` (que liga tag a lançamento, e lançamento a painel) — sem precisar
adicionar `IdPainel` na tabela `Tags` nem duplicar tags entre usuários. O frontend passa a resolver
nomes de tag por painel, não globalmente por usuário logado.

## Technical Context

**Language/Version**: TypeScript 5 / Angular (NgModules) no frontend (`dashfinras-web`); C# / .NET
no backend (`api-dashfinras`)

**Primary Dependencies**: Angular `HttpClient`, RxJS (frontend); ASP.NET Core, EF Core (backend)

**Storage**: PostgreSQL via EF Core — tabelas `Tags`, `MovimentacoesFinanceiras`,
`MovimentacoesFinanceirasTags` (join N:N), `PaineisUsuarios`

**Testing**: `ng test` (Vitest) no frontend; xUnit no backend (`DashFinRas.Api.test`)

**Target Platform**: Web (SSR/CSR Angular app + API REST .NET)

**Project Type**: Web application (frontend `dashfinras-web` + backend `api-dashfinras`, repos
separados)

**Performance Goals**: Resolução de nomes de tag não deve adicionar mais que 1 chamada extra por
carregamento de painel (mesma ordem de grandeza do `carregarTags()` atual)

**Constraints**: Não pode vazar tags de painéis aos quais o usuário não pertence (mesmo controle
de acesso hoje usado em `MovimentacaoFinanceiraRepository` via `PaineisUsuarios`)

**Scale/Scope**: Afeta toda tela `painel-detalhe` para qualquer painel com mais de um membro

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution do projeto (`.specify/memory/constitution.md`) está no template padrão, não
ratificada com princípios específicos — nenhum gate bloqueante identificado. Seguir os padrões já
documentados em `CLAUDE.md` de cada repo (camada de serviço fina em `dashfinras-web`, DTOs
`RequestX`/`ResponseX` espelhando a API).

## Project Structure

### Documentation (this feature)

```text
specs/010-tags-painel-compartilhado/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
# api-dashfinras (.NET) — repo irmão, referenciado por caminho relativo ../api-dashfinras
src/DashFinRas/
├── Controllers/TagController.cs                 # novo endpoint escopado por painel
├── Services/TagService.cs / ITagService.cs       # novo método ListarPorPainelAsync
├── Repositories/TagRepository.cs / ITagRepository.cs  # nova query via MovimentacoesFinanceirasTags
└── Dto/Tag/                                      # DTOs de resposta reaproveitados

# dashfinras-web (Angular) — este repo
src/app/core/
├── models/tag.model.ts                           # sem mudança de shape, só de escopo de chamada
├── services/tag.service.ts                       # novo método listarPorPainel(idPainel)
└── features/painel/painel-detalhe/painel-detalhe.ts  # carregarTags() passa a usar o novo método
```

**Structure Decision**: Web application com dois repositórios independentes (frontend/backend já
existentes) — feature toca ambos, sem criar projeto novo.

## Complexity Tracking

Nenhuma violação de constitution a justificar.
