# Implementation Plan: Gerenciar usuários do painel

**Branch**: `feature/22-gerenciar-usuarios-painel` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-gerenciar-usuarios-painel/spec.md`

## Summary

Conectar o botão "Usuários" já existente (sem ação) no cabeçalho de `painel-detalhe` a um modal que
mostra a lista atual de membros do painel (somente leitura) e permite adicionar novos por e-mail +
papel, reaproveitando 100% do fluxo de convite construído na issue #23 (`ConviteService`,
`RequestCriarConviteDto`). Nenhum endpoint novo — remover/alterar papel de membro existente ficam
fora de escopo por falta de suporte no backend (ver `spec.md` › Assumptions).

## Technical Context

**Language/Version**: TypeScript 5 / Angular (NgModules, standalone: false)

**Primary Dependencies**: Angular Reactive Forms, RxJS — sem bibliotecas novas; reaproveita
`ConviteService`/`PainelService`/`AccountService` já existentes

**Storage**: N/A no frontend — lista de usuários vem do `ResponsePainelDto` já carregado por
`painel-detalhe` (`PainelService.obterPainel`), sem chamada dedicada de listagem

**Testing**: `ng test` (vitest), no padrão dos specs já existentes

**Target Platform**: SPA Angular (zoneless) servida via BFF, mesmo ambiente das features anteriores

**Project Type**: Web application (frontend), projeto único

**Performance Goals**: Sem metas específicas além dos padrões já praticados; volume de usuários por
painel é pequeno (dezenas, não milhares)

**Constraints**: `PUT /api/painel/{id}/adicionar-usuario` (`RequestAddUsuarioPainelDto`) é
estritamente insert-only no backend real — confirmado via código-fonte da `api-dashfinras`
(`PainelRepository.AddUsuarioPainel` filtra silenciosamente ids já membros, sem erro e sem update).
Essa constraint já era conhecida antes do plano (motivou o escopo reduzido no spec) — não há
`research.md` com decisões pendentes de resolver aqui, é só reafirmada como constraint de design.

**Scale/Scope**: 1 modal novo dentro do módulo `painel` já existente (`painel-detalhe`); nenhuma
rota nova, nenhum módulo novo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` continua no template padrão, sem princípios ratificados — nenhum
gate formal a aplicar. Seguindo os mesmos padrões de `CLAUDE.md`/`docs/padroes-frontend.md` já
usados na issue #23 (zoneless: estado assíncrono em `signal()`; NgModules; DTOs espelhando a API;
reaproveitar componentes/serviços existentes em vez de duplicar). Nenhuma violação a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/002-gerenciar-usuarios-painel/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/app/
├── core/
│   └── models/painel.model.ts        # Sem alteração de contrato — PainelUsuarioDto já cobre o
│                                     #   que a lista precisa exibir
│
└── features/painel/
    ├── painel-detalhe/
    │   ├── painel-detalhe.html        # ALTERADO: botão "Usuários" ganha (click), modal novo
    │   ├── painel-detalhe.scss        # ALTERADO: estilos do modal (reuso de tokens + padrões já
    │   │                             #   usados em painel-criar.scss para o bloco de adicionar)
    │   └── painel-detalhe.ts          # ALTERADO: estado do modal (aberto/fechado), lista local de
    │                                 #   usuários (derivada de `painel().usuarios`), integração com
    │                                 #   ConviteService pra adicionar por e-mail
    └── painel-module.ts               # Sem alteração — nenhum componente novo, modal é parte do
                                       #   template de PainelDetalhe (mesmo padrão de "Renomear"/
                                       #   "Excluir", que já são modais inline no mesmo componente)
```

**Structure Decision**: Nenhuma estrutura nova. Diferente da issue #23 (que precisou de um módulo
de rota própria pra `/convites/:token`, pública), esta feature é 100% contida dentro do componente
`PainelDetalhe` já existente, no mesmo padrão dos modais "Renomear painel" e "Excluir painel" já
implementados ali (signal de aberto/fechado, form reativo, tratamento de erro local). Reaproveita
`ConviteService`/`RequestCriarConviteDto` de `core/` sem alteração.

## Complexity Tracking

*Sem violações a justificar — nenhum gate de constituição aplicável, e a estrutura segue exatamente
o padrão já em uso no componente `PainelDetalhe`.*
