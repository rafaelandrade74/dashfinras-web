# Implementation Plan: Service e models de movimentações financeiras

**Branch**: `dfw-1-service-e-models-de-movimentacoes-financeiras` | **Date**: 2026-08-27 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from
`specs/008-service-movimentacao-financeira/spec.md`

**Implemented in**: commit `5b9d99a` — "[DFW-1] feat(movimentacoes): adiciona models e
service de movimentacoes financeiras"

## Summary

Criar, em `src/app/core/`, os models TypeScript e o service Angular que encapsulam o
acesso HTTP ao domínio de movimentações financeiras da `api-dashfinras`
(`/movimentacoes-financeiras`), seguindo exatamente o padrão arquitetural já usado por
`painel.service.ts`/`convite.service.ts`: um service único `providedIn: 'root'`, com
`baseUrl` derivado de `environment.apiUrl`, expondo métodos finos (um por operação da API)
que apenas montam a requisição HTTP e devolvem o `Observable` cru, sem lógica de negócio
nem tratamento de erro embutido. Nenhuma tela/componente é criado nesta entrega — é
puramente a camada de dados, pré-requisito para as futuras telas de lançamento/consulta
financeira.

## Technical Context

**Language/Version**: TypeScript 5 / Angular (NgModules, standalone: false)

**Primary Dependencies**: `@angular/common/http` (`HttpClient`, `HttpParams`), RxJS
(`Observable`) — sem bibliotecas novas; nenhuma dependência adicionada além das já usadas
por `painel.service.ts`/`convite.service.ts`

**Storage**: N/A (via API `api-dashfinras`, sem estado local persistido)

**Testing**: `ng test` (vitest via `@angular/build:unit-test`) —
`movimentacao-financeira.service.spec.ts`, cobrindo sucesso e erro de cada um dos seis
métodos, no mesmo padrão de `HttpTestingController` já usado nos specs de
`painel.service`/`convite.service`

**Target Platform**: Navegador (Angular SSR/CSR, app zoneless — ver
`docs/padroes-frontend.md`)

**Project Type**: Web application — frontend Angular consumindo API .NET via BFF Node
(`/api/*`)

**Performance Goals**: N/A — camada fina de acesso a dados, sem processamento além do
mapeamento de filtro para `HttpParams`

**Constraints**: Nenhum estado local reativo (`signal`) é necessário nesta entrega — o
service não guarda estado, apenas expõe `Observable`s por chamada, então a restrição
zoneless do projeto não se aplica diretamente aqui (aplicável apenas às telas que
consumirão este service no futuro)

**Scale/Scope**: 2 arquivos novos de produção (models + service) e 1 arquivo de teste;
nenhum componente, rota ou módulo novo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` ainda está com os placeholders do template (nenhum
princípio definido para este projeto) — não há gates formais a avaliar. Nenhuma violação a
justificar.

## Project Structure

### Documentation (this feature)

```text
specs/008-service-movimentacao-financeira/
├── plan.md    # This file (documentação retroativa)
├── spec.md    # Especificação retroativa
└── tasks.md   # Lista de tarefas retroativa (todas já concluídas)
```

### Source Code (repository root)

Projeto único Angular. Toda a feature vive em `src/app/core/`, sem componente ou rota
nova:

```text
src/app/core/
├── models/
│   └── movimentacao-financeira.model.ts       # NOVO — enums + interfaces (DTOs)
└── services/
    ├── movimentacao-financeira.service.ts      # NOVO — MovimentacaoFinanceiraService
    └── movimentacao-financeira.service.spec.ts # NOVO — testes de sucesso/erro dos 6 métodos
```

**Structure Decision**: Reaproveita 100% a estrutura já usada por
`painel.service.ts`/`painel.model.ts` e `convite.service.ts`/`convite.model.ts` — mesmo
diretório (`core/models`, `core/services`), mesma convenção de nomenclatura de arquivo
(`<dominio>.model.ts`/`<dominio>.service.ts`), mesmo padrão de injeção
(`@Injectable({ providedIn: 'root' })` com `HttpClient` injetado via construtor) e mesma
forma de compor a URL base a partir de `environment.apiUrl`. Nenhum padrão novo foi
introduzido.

### Decisões de design

- **Um service por domínio, não um service genérico de HTTP**: consistente com
  `PainelService`/`ConviteService` já existentes — cada domínio de negócio tem seu próprio
  service fino.
- **Filtro de consulta via `HttpParams` construído dinamicamente**: `consultar()` itera as
  chaves de `GetMovimentacaoFiltroDto` e só adiciona ao `HttpParams` os campos com valor
  definido, evitando enviar query params vazios/`undefined` — mesma técnica que evita
  acoplar o service a um formulário específico de filtro.
- **Enums numéricos espelhando a API**: `TipoMovimentacao`/`StatusMovimentacao` usam os
  mesmos valores inteiros dos enums C# da API (`Despesa = 0`/`Receita = 1`,
  `Pendente = 0`/`Pago = 1`), evitando qualquer camada de tradução string↔número entre
  cliente e servidor.
- **Sem tratamento de erro no service**: o `Observable` de cada método propaga o erro HTTP
  cru para o consumidor, mesmo padrão de `painel.service.ts`/`convite.service.ts` — o
  tratamento (mensagens amigáveis, retry, etc.) é responsabilidade dos componentes que
  consumirão o service.

## Complexity Tracking

Não aplicável — Constitution Check não identificou violações a justificar.
