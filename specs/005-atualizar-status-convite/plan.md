# Implementation Plan: Atualizar Status de Convite para Novo Formato da API

**Branch**: `005-atualizar-status-convite` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-atualizar-status-convite/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

A API (`api-dashfinras`) reduziu o status de convite para um enum de 4 valores,
`StatusConviteExibicao` (Pendente, Aprovado, Recusado, Expirado), substituindo o antigo enum de 6
valores. O frontend precisa: (1) trocar o `StatusConvite` local (numérico, 6 valores) por um tipo
de string com os 4 novos valores; (2) atualizar o mapeamento de rótulo/estilo visual usado no
histórico de convites (`painel-detalhe.ts`/`.html`); (3) atualizar `podeReenviar` para permitir
reenvio apenas em Recusado/Expirado; e (4) tratar com segurança um status desconhecido (fallback
neutro) em vez de quebrar a listagem. Mudança isolada ao módulo `painel-detalhe` e ao model
`convite.model.ts` — sem mudanças de rota, guard ou BFF.

## Technical Context

**Language/Version**: TypeScript 5 / Angular 20 (NgModules, zoneless, standalone: false)

**Primary Dependencies**: Angular `HttpClient` (via `ConviteService`), RxJS signals (`signal()`)

**Storage**: N/A (consome API remota via BFF `/api`; nenhum dado persistido localmente)

**Testing**: `ng test` (vitest via `@angular/build:unit-test`) — specs `.spec.ts` junto ao componente

**Target Platform**: Browser (SPA/CSR), Node BFF apenas faz proxy — sem lógica de status no servidor

**Project Type**: Web application (frontend Angular consumindo API .NET via BFF Node) — mudança
restrita ao frontend

**Performance Goals**: N/A (mapeamento síncrono em memória, sem impacto de performance mensurável)

**Constraints**: Compatibilidade com o novo contrato da API (`StatusConviteExibicao`); não pode
quebrar a listagem de convites caso um status inesperado seja recebido (FR-006)

**Scale/Scope**: 1 componente (`PainelDetalhe`), 1 model (`ConviteModel`) — escopo pequeno e
localizado, sem novas telas ou rotas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` deste projeto ainda está com os placeholders padrão do
template (nenhum princípio foi preenchido) — não há gates de constituição ativos para avaliar.
Seguindo as convenções já documentadas em `CLAUDE.md` (NgModules, zoneless/signals, Prettier,
strings em português), sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   └── models/
│       └── convite.model.ts          # StatusConvite: novo tipo de 4 valores (string)
└── features/
    └── painel/
        └── painel-detalhe/
            ├── painel-detalhe.ts      # STATUS_INFO map + statusInfo()/podeReenviar()
            ├── painel-detalhe.html    # binding de rótulo/classe/botão reenviar
            └── painel-detalhe.spec.ts # cobertura de mapeamento de status (novo/expandido)
```

**Structure Decision**: Projeto Angular único já existente (sem backend neste repo — API é
consumida via BFF). Mudança confinada a `core/models/convite.model.ts` (definição do enum/tipo de
status) e ao componente `features/painel/painel-detalhe` (única tela que lê `StatusConvite`), sem
necessidade de novos diretórios.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
