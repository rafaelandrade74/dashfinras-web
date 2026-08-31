# Implementation Plan: Remover usuário e alterar papel no painel

**Branch**: `007-remover-alterar-papel-painel` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-remover-alterar-papel-painel/spec.md`

## Summary

Adicionar, às linhas de membro já renderizadas no modal "Usuários do painel" (`painel-detalhe`,
entrega da spec 002/issue #22), dois controles de ação por linha: remover o membro do painel e
alterar seu papel (Adm/Membro/Visualizador). Ambos consomem os dois endpoints que a
`api-dashfinras` passou a expor no PR #45 (`DELETE /api/painel/{id}/usuario/{idUsuario}` e
`PUT /api/painel/{id}/usuario/{idUsuario}/permissao`), que já implementam as regras de quem pode
agir sobre quem — a UI apenas reflete essas regras ocultando controles indevidos e tratando os
erros de negócio que a API retorna. Nenhuma tela nova: mesmo modal, mesmo modelo visual (badges,
avatares) já aprovado.

## Technical Context

**Language/Version**: TypeScript 5 / Angular (NgModules, standalone: false)

**Primary Dependencies**: Angular Reactive Forms (não necessário aqui — ações diretas, sem
formulário novo), RxJS — sem bibliotecas novas; reaproveita `PainelService`/`AccountService` já
existentes

**Storage**: N/A (via API `api-dashfinras`, sem estado local persistido)

**Testing**: `ng test` (vitest via `@angular/build:unit-test`) — specs de componente
(`painel-detalhe.spec.ts`) cobrindo visibilidade de controles e chamadas de serviço

**Target Platform**: Navegador (Angular SSR/CSR, app zoneless — ver `docs/padroes-frontend.md`)

**Project Type**: Web application — frontend Angular consumindo API .NET via BFF Node (`/api/*`)

**Performance Goals**: N/A — operações pontuais de UI (remoção/alteração de papel), sem requisito
de performance específico além da resposta perceptível padrão do modal já existente

**Constraints**: App roda sem zone.js (zoneless) — todo estado atualizado dentro de
`.subscribe()`/callback assíncrono precisa ser `signal()`, não campo de classe comum

**Scale/Scope**: 2 novas ações de UI (remover, alterar papel) sobre uma lista já existente de até
dezenas de membros por painel; nenhum novo componente/rota — extensão de
`painel-detalhe.ts`/`.html`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda está com os placeholders do template (nenhum princípio
definido para este projeto) — não há gates formais a avaliar. Nenhuma violação a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/007-remover-alterar-papel-painel/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Projeto único Angular (frontend-only neste repositório; `api-dashfinras` é um repo irmão já
implementado). Toda a feature vive dentro dos arquivos já existentes de
`src/app/features/painel/painel-detalhe/` e `src/app/core/`, sem componente ou rota nova:

```text
src/app/
├── core/
│   ├── models/painel.model.ts        # + RequestEditarPermissaoUsuarioPainelDto
│   └── services/painel.service.ts    # + removerUsuarioPainel, editarPermissaoUsuarioPainel
└── features/painel/painel-detalhe/
    ├── painel-detalhe.ts             # + signals e métodos de remoção/alteração de papel
    ├── painel-detalhe.html           # + controles por linha (remover, seletor de papel)
    ├── painel-detalhe.scss           # + estilos dos novos controles (se necessário)
    └── painel-detalhe.spec.ts        # + testes dos novos fluxos
```

**Structure Decision**: Reaproveita 100% a estrutura da spec 002 — nenhum arquivo novo fora dos
listados acima. `PainelService` ganha dois métodos (`removerUsuarioPainel`,
`editarPermissaoUsuarioPainel`) espelhando os dois endpoints do PR #45 da `api-dashfinras`;
`PainelDetalhe` ganha os signals/handlers para os dois novos fluxos, seguindo o mesmo padrão já
usado para excluir painel (`excluirAberto`/`confirmarExcluir`) e adicionar usuário
(`adicionandoUsuario`/`adicionarUsuario`).

## Complexity Tracking

Não aplicável — Constitution Check não identificou violações a justificar.
