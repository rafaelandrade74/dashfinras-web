# Implementation Plan: CTA da página inicial reflete sessão ativa

**Branch**: `004-login-painel-cta` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-login-painel-cta/spec.md`

## Summary

Corrigir dois pontos de inconsistência entre a UI e o estado real de autenticação: (1) na landing page, o texto/destino do botão de CTA da navbar e do CTA principal deve refletir a sessão ativa de forma confiável, mesmo antes do fetch de sessão do boot terminar (hoje `Landing` lê `authService.isAuthenticated` de forma síncrona em getters simples, sem esperar `waitUntilReady()`, então numa app zoneless a UI pode ficar presa mostrando "Entrar" mesmo após a sessão ser confirmada, pois nada dispara CD depois); e (2) a página de login deve redirecionar automaticamente usuários já autenticados para longe do formulário — hoje `LoginComponent` não tem `ngOnInit` e sempre renderiza o formulário, mesmo com sessão válida. O redirecionamento deve respeitar `redirectUrl` da query string apenas se for um caminho interno (mesma proteção contra open redirect que ainda não existe hoje, pois `redirectUrl` é usado sem validação em `login.ts`).

## Technical Context

**Language/Version**: TypeScript 5.x / Angular (versão do `package.json` do repo), NgModules (não standalone)

**Primary Dependencies**: `@angular/core`, `@angular/router`, `AuthService` (`core/services/auth.service.ts`), zoneless change detection (`provideZonelessChangeDetection` presumido pelo padrão documentado em `docs/padroes-frontend.md`)

**Storage**: N/A (nenhuma persistência nova; estado de sessão já existe via cookie `df_session` + `BehaviorSubject` interno do `AuthService`)

**Testing**: Vitest via `@angular/build:unit-test` (`npm test`), specs `.spec.ts` ao lado dos componentes/serviços (padrão já usado em `login.spec.ts`, `auth.guard.spec.ts`, `account.guard.spec.ts`)

**Target Platform**: Navegador (SPA client-side, CSR-only conforme `app.routes.server.ts` com `RenderMode.Client`)

**Project Type**: Web application (frontend Angular + BFF Node — mudança é só frontend/UI, sem tocar `src/server/*`)

**Performance Goals**: Sem meta nova de performance; a troca de texto do botão deve ocorrer assim que `waitUntilReady()` resolver (tipicamente <1s, já ditado pelo boot atual), sem bloquear a renderização inicial da landing page

**Constraints**: App é zoneless (`docs/padroes-frontend.md`) — qualquer estado atualizado fora do fluxo síncrono de template binding (ex.: após `await waitUntilReady()`) precisa estar em um `signal()` para o binding recalcular; não pode reintroduzir chamada a `account/login`/`account/logout` (não existe mais no BFF); redirecionamento não pode aceitar `redirectUrl` externo (proteção open-redirect)

**Scale/Scope**: 2 componentes afetados (`LandingComponent`, `LoginComponent`) + possível pequeno helper de validação de URL interna reutilizável entre eles; nenhuma rota nova, nenhum guard novo necessário (a landing e o login continuam sem guard, por design)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` deste projeto ainda é o template não preenchido (placeholders `[PRINCIPLE_1_NAME]` etc.) — não há princípios ratificados para este repositório. Nenhum gate aplicável; segue-se o padrão documentado em `CLAUDE.md` / `docs/padroes-frontend.md` como guia de qualidade de facto (zoneless + signals, NgModules, Prettier).

**Status**: PASS (sem constituição ratificada para violar)

## Project Structure

### Documentation (this feature)

```text
specs/004-login-painel-cta/
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
├── features/
│   ├── home/
│   │   └── landing/
│   │       ├── landing.ts        # MODIFICAR: expor estado de auth como signal, aguardar waitUntilReady()
│   │       ├── landing.html       # MODIFICAR (se necessário): bindings continuam usando os mesmos getters/campos
│   │       └── landing.spec.ts    # MODIFICAR/CRIAR: casos de loading → autenticado / não autenticado
│   └── auth/
│       └── login/
│           ├── login.ts           # MODIFICAR: adicionar ngOnInit que verifica sessão e redireciona
│           └── login.spec.ts      # MODIFICAR: casos de redirecionamento automático + validação de redirectUrl
├── core/
│   ├── services/
│   │   └── auth.service.ts        # MODIFICAR (opcional): expor estado de sessão "pronto" de forma reativa, se necessário
│   └── utils/ (ou local ao módulo)
│       └── internal-url.ts        # NOVO (ou colocado junto a login.ts): helper para validar que redirectUrl é um caminho interno
```

**Structure Decision**: Projeto único Angular (frontend), sem necessidade de tocar o BFF (`src/server/*`). Segue a estrutura de módulos por feature já existente (`features/home/landing`, `features/auth/login`), adicionando um pequeno helper de validação de URL — colocado como função utilitária simples (não um serviço injetável, pois é uma função pura sem dependências) reaproveitada pelos dois componentes.

## Complexity Tracking

*Sem violações — nenhuma linha necessária.*
