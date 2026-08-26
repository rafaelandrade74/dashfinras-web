# Implementation Plan: Convite de usuário por e-mail

**Branch**: `feature/23-convite-usuario-email` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-convite-usuario-email/spec.md`

## Summary

Permitir que o dono de um painel convide outras pessoas informando apenas o e-mail e um papel
(Adm/Membro/Visualizador), sem precisar de um ID de usuário. O backend (`api-dashfinras`) já expõe
todos os endpoints de convite (`v1.json`); este trabalho é 100% de consumo desses endpoints no
frontend Angular (`dashfinras-web`): uma seção "Usuários (opcional)" no modal de criação de painel,
uma página pública `/convites/:token` para aceitar/recusar, e uma aba "Convites enviados" na tela
de detalhe do painel (só para o dono). Segue o design de telas já aprovado (artboards 01-04) e o
padrão visual existente (`painel-criar.scss`: paleta paper/ink + IBM Plex Sans/Fraunces).

## Technical Context

**Language/Version**: TypeScript 5 / Angular (NgModules, standalone: false), conforme `angular.json`

**Primary Dependencies**: Angular Reactive Forms, Angular Router, RxJS — sem bibliotecas novas

**Storage**: N/A no frontend — estado do convite vive inteiramente na API (`api-dashfinras`); no
frontend, a lista de e-mails pendentes durante a criação do painel é estado local do componente
(signal), descartado após o submit

**Testing**: `ng test` (vitest via `@angular/build:unit-test`), no padrão dos specs já existentes
(ex.: `painel-list.spec.ts`)

**Target Platform**: Navegador (SPA client-side, zoneless), servido via BFF Node/Express (SSR shell
+ proxy `/api/*`) — sem novo trabalho de servidor além do roteamento client-side

**Project Type**: Web application (frontend Angular consumindo API .NET via BFF) — projeto único
`dashfinras-web`, sem estrutura backend/frontend separada dentro deste repo

**Performance Goals**: Sem metas específicas além dos padrões já praticados no app (SPA, sem SSR de
página); não há chamadas pesadas ou de alto volume neste fluxo

**Constraints**: A página `/convites/:token` precisa ser acessível sem sessão ativa para exibir os
dados do convite (`GET /api/convites/{token}`), mas aceitar/recusar exige sessão — reaproveitar o
mecanismo existente de `authGuard` + `redirectUrl` para o retorno pós-login

**Scale/Scope**: 1 seção nova em tela existente (criar painel), 1 rota pública nova de 1-2 telas
(convite: pendente/decidido/expirado/inválido), 1 aba nova em tela existente (detalhe do painel).
Sem novos módulos de domínio além de um pequeno `ConviteModule`/rota isolada

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` neste repositório ainda está no template padrão (placeholders não
preenchidos, sem princípios ratificados) — não há gates formais a aplicar. Seguindo os padrões já
documentados em `CLAUDE.md` e `docs/padroes-frontend.md` (zoneless: estado assíncrono em `signal()`;
NgModules, não standalone; DTOs espelhando a API) como guia de facto. Nenhuma violação a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/001-convite-usuario-email/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/app/
├── core/
│   ├── models/
│   │   └── convite.model.ts                     # NOVO: PainelPermissao (reuso), StatusConvite,
│   │                                             #   RequestCriarConviteDto, ResponseConviteDto,
│   │                                             #   ResponseConvitesDto
│   └── services/
│       └── convite.service.ts                   # NOVO: wrapper HttpClient sobre /api/painel/{id}/convites
│                                                 #   e /api/convites/{token}(/aprovar|/recusar)
│
├── features/
│   ├── painel/
│   │   ├── painel-criar/
│   │   │   ├── painel-criar.html                # ALTERADO: seção "Usuários (opcional)"
│   │   │   ├── painel-criar.scss                 # ALTERADO: estilos da seção (reuso de tokens)
│   │   │   └── painel-criar.ts                   # ALTERADO: lista local de pendentes (signal) +
│   │                                             #   disparo de convites pós-criação do painel
│   │   ├── painel-detalhe/
│   │   │   ├── painel-detalhe.html               # ALTERADO: aba "Convites enviados" (só dono)
│   │   │   ├── painel-detalhe.scss               # ALTERADO
│   │   │   └── painel-detalhe.ts                 # ALTERADO: carrega convites via ConviteService
│   │   └── painel-module.ts                      # ALTERADO se novo componente compartilhado for
│   │                                             #   declarado aqui (avaliar em Phase 1)
│   │
│   └── convite/                                  # NOVO módulo, lazy-loaded, rota pública
│       ├── convite-module.ts
│       ├── convite-routing-module.ts
│       └── convite-responder/
│           ├── convite-responder.html            # Estados: pendente / aceito / recusado /
│           │                                     #   expirado / inválido
│           ├── convite-responder.scss
│           └── convite-responder.ts
│
└── app-routing-module.ts                         # ALTERADO: rota `/convites/:token` (pública,
                                                    #   sem authGuard — o próprio componente decide
                                                    #   redirecionar para login quando necessário)

src/app/core/models/painel.model.ts                # Sem alteração de contrato (PainelPermissao já
                                                    #   existe e é reaproveitado)
```

**Structure Decision**: Projeto único (SPA Angular + BFF Node, sem split backend/frontend dentro do
repo — o backend é o repositório irmão `api-dashfinras`, fora de escopo). Novo domínio "Convite"
ganha `core/models/convite.model.ts` + `core/services/convite.service.ts` (mesmo padrão de
`painel.model.ts`/`painel.service.ts`) e um módulo de feature próprio `features/convite/` porque a
tela de resposta ao convite é uma rota pública de nível de app (`/convites/:token`), fora do guard
`authGuard → accountGuard` usado por `/paineis`. As telas 01 e 04 do design (seção no modal de criar
painel e aba de convites enviados) são alterações dentro do módulo `painel` já existente, não novos
componentes de rota.

## Complexity Tracking

*Sem violações a justificar — nenhum gate de constituição aplicável (arquivo ainda em template) e a
estrutura proposta segue os padrões já em uso no repositório.*
