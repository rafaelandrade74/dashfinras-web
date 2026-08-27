# Implementation Plan: Redirecionamento de login/cadastro ao responder convite

**Branch**: `006-redirecionamento-login-convite` | **Date**: 2026-08-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-redirecionamento-login-convite/spec.md`

## Summary

A tela pública de convite (`/convites/:token`) hoje não exige sessão nem cadastro completo antes de
consultar o convite: para quem não está logado, a chamada `GET` ao convite falha com 401 (o proxy
BFF recusa requisições sem sessão) e o componente interpreta esse erro genérico como "convite
inválido", escondendo o motivo real. Não há nenhum tratamento equivalente para quem está logado mas
ainda não completou o cadastro de usuário.

A abordagem técnica é reaproveitar a infraestrutura de guards já existente no app (`authGuard` +
`accountGuard`, o mesmo par usado por `/paineis`) na rota `/convites/:token`, em vez de criar lógica
de redirecionamento nova. Isso garante que o componente `ConviteResponder` só é carregado — e só
então consulta o convite pelo token — quando a pessoa já está autenticada e com cadastro completo,
exatamente na ordem definida pela clarificação (sempre autenticar/cadastrar primeiro; a validade do
próprio convite só é conferida depois). `authGuard` já redireciona para
`/login?redirectUrl=<url atual>`, `accountGuard` já redireciona para
`/completar-cadastro?redirectUrl=<url atual>` quando a API responde `USER_NOT_FOUND`, e tanto
`login.ts` (fluxo de login e de cadastro de conta) quanto `completar-cadastro.ts` já navegam de
volta para esse `redirectUrl` ao concluir — cobrindo as três User Stories da spec sem exigir nenhum
mecanismo de redirecionamento novo. O único ajuste necessário no componente de convite é remover a
checagem de autenticação ad-hoc que hoje só existe dentro de `aceitar()`/`recusar()` (redundante
depois que a rota passa a ser guardada) e simplificar o carregamento inicial, que pode assumir uma
sessão já válida.

## Technical Context

**Language/Version**: TypeScript (Angular 22, NgModules — `standalone: false`)

**Primary Dependencies**: Angular Router (`CanActivateFn` guards), RxJS; nenhuma dependência nova

**Storage**: N/A (nenhuma persistência nova; reutiliza sessão via cookie `df_session` já existente)

**Testing**: Vitest via `@angular/build:unit-test` (`ng test`), TestBed para componentes/guards

**Target Platform**: Navegador (Angular CSR), servidor Node/Express (BFF) apenas para servir a rota

**Project Type**: Web application (frontend Angular + BFF Node existente; nenhuma mudança no BFF)

**Performance Goals**: N/A — mudança é de roteamento/guard, sem impacto de desempenho perceptível

**Constraints**: Não pode reintroduzir chamadas a endpoints removidos da API
(`account/login`/`account/logout`); deve reusar `authGuard`/`accountGuard` sem alterar seu contrato
público, já consumido por `/paineis` e `/completar-cadastro`

**Scale/Scope**: Uma rota (`/convites/:token`), um componente (`ConviteResponder`), sem novas
entidades ou endpoints de API

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` deste projeto ainda está com os placeholders do
template (nenhum princípio foi preenchido) — não há gates de constituição aplicáveis a este
projeto no momento. **Gate: PASS (nada a verificar).**

## Project Structure

### Documentation (this feature)

```text
specs/006-redirecionamento-login-convite/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── checklists/
    └── requirements.md
```

Sem diretório `contracts/`: a feature não introduz nem altera nenhum contrato de API — ela apenas
reordena quando o frontend chama endpoints já existentes (`GET/POST /api/convite/...`), controlado
inteiramente por guards de rota Angular.

### Source Code (repository root)

```text
src/app/
├── app-routing-module.ts                  # rota /convites/:token ganha canActivate: [authGuard, accountGuard]
├── core/
│   └── guards/
│       ├── auth.guard.ts                  # reutilizado sem alteração
│       └── account.guard.ts               # reutilizado sem alteração
└── features/
    ├── auth/login/login.ts                # reutilizado sem alteração (já suporta redirectUrl)
    ├── cadastro/completar-cadastro/
    │   └── completar-cadastro.ts          # reutilizado sem alteração (já suporta redirectUrl)
    └── convite/
        └── convite-responder/
            ├── convite-responder.ts       # remove checagem de auth ad-hoc em aceitar()/recusar()
            └── convite-responder.spec.ts  # (novo) cobre carregamento assumindo sessão já válida
```

**Structure Decision**: Nenhuma estrutura nova. A mudança se concentra em `app-routing-module.ts`
(adicionar guards à rota existente) e em uma simplificação de `convite-responder.ts` para remover a
lógica de redirecionamento que se torna redundante. Nenhum novo módulo, serviço ou componente é
criado.

## Complexity Tracking

*Nenhuma violação de constituição a justificar — seção não aplicável.*
