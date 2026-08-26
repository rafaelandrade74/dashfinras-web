# Implementation Plan: Histórico de convites no modal de usuários

**Branch**: `feature/22-gerenciar-usuarios-painel` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-historico-convites-usuarios/spec.md`

## Summary

Adicionar uma navegação por abas ao modal "Usuários do painel" (já implementado na issue #22,
`painel-detalhe.html`/`.ts`, dentro do bloco `@if (usuariosAberto())`): a aba "Usuários" existente
não muda, e uma nova aba "Convites enviados" lista os convites já enviados àquele painel
(`ConviteService.listarConvites`), com botão de reenviar em status Recusado/Expirado/Invalidado
(`ConviteService.criarConvite`, mesmo DTO da issue #23). Nenhum endpoint/DTO novo.

## Technical Context

**Language/Version**: TypeScript 5 / Angular (NgModules, standalone: false)

**Primary Dependencies**: Angular Reactive Forms/RxJS — sem bibliotecas novas; reaproveita
`ConviteService` já existente (issue #23)

**Storage**: N/A no frontend — lista de convites vem de `GET /api/painel/{id}/convites`, buscada
sob demanda (FR-003), sem cache persistente além do tempo de vida do modal aberto

**Testing**: `ng test` (vitest), padrão já usado no projeto

**Target Platform**: SPA Angular (zoneless), mesmo componente `PainelDetalhe` já existente

**Project Type**: Web application (frontend), projeto único

**Performance Goals**: Sem metas específicas; volume de convites por painel é pequeno

**Constraints**: Depende do modal da issue #22 já estar implementado no mesmo componente
(`usuariosAberto`, `adicionarUsuarioForm`, etc. — ver `painel-detalhe.ts` atual). Não pode quebrar
a aba "Usuários" existente nem os testes já passando.

**Scale/Scope**: Extensão de um bloco já existente em `painel-detalhe.{ts,html,scss}` — nenhum
arquivo novo, nenhum módulo novo, nenhuma rota nova.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` continua no template padrão — nenhum gate formal a aplicar.
Seguindo os padrões já estabelecidos nas issues #22/#23 (zoneless: estado assíncrono em `signal()`;
reaproveitar serviços/DTOs existentes; carregar dados sob demanda, não antecipadamente). Nenhuma
violação a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/003-historico-convites-usuarios/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command) — reaproveita contracts da #23
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/app/features/painel/painel-detalhe/
├── painel-detalhe.ts     # ALTERADO: signals de aba ativa do modal (`usuariosAba`), estado da
│                        #   lista de convites (`convites`, `carregandoConvites`, `erroConvites`),
│                        #   estado de reenvio por linha (`reenviandoConviteId`), método de troca
│                        #   de aba (com lazy-load na primeira vez — FR-003) e `reenviarConvite()`
├── painel-detalhe.html   # ALTERADO: tab-row dentro do modal "Usuários do painel" (dentro do
│                        #   mesmo `@if (usuariosAberto())`), pane de convites com estado
│                        #   vazio/erro/lista
└── painel-detalhe.scss   # ALTERADO: estilos da tab-row e da lista de convites dentro do modal
                          #   (reaproveitando tokens já usados: `.status-badge` por status, já
                          #   definido em outro lugar do app — ver research.md)
```

**Structure Decision**: Nenhum arquivo novo. Tudo dentro do componente `PainelDetalhe` já
existente, estendendo o mesmo `@if (usuariosAberto())` da issue #22 com uma navegação por abas
interna — não um novo modal, não uma nova rota. `ConviteService.listarConvites`/`criarConvite` são
importados sem alteração (já usados por `adicionarUsuario()` da issue #22 no mesmo arquivo).

## Complexity Tracking

*Sem violações a justificar — extensão direta de um componente já existente, sem estrutura nova.*
