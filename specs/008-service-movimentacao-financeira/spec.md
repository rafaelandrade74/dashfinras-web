# Feature Specification: Service e models de movimentações financeiras

**Feature Branch**: `[008-service-movimentacao-financeira]` (implementada em
`dfw-1-service-e-models-de-movimentacoes-financeiras`)

**Created**: 2026-08-27

**Status**: Implemented (documentação retroativa — commit `5b9d99a`)

**Input**: User description: "Criar a camada de acesso a dados do frontend (models TS +
service Angular) para o domínio de movimentações financeiras, espelhando os DTOs já
expostos pela `api-dashfinras` (modelo de movimentações financeiras, PR #39 daquele
repositório), como base para as telas de lançamento/consulta que serão construídas em
seguida." Esta spec documenta a posteriori o que já foi implementado e entregue no commit
`5b9d99a`, sem introduzir nenhuma tela — é uma entrega puramente de infraestrutura de
dados do cliente (models + service), seguindo o mesmo padrão já usado por
`painel.service.ts`/`convite.service.ts`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Camada de dados para movimentações financeiras (Priority: P1)

Como desenvolvedor do frontend, preciso de um service Angular tipado que encapsule todas
as chamadas HTTP ao endpoint `/movimentacoes-financeiras` da API, para que as futuras
telas de lançamento e consulta financeira não precisem lidar diretamente com
`HttpClient`/`HttpParams` nem redefinir os contratos de dados em múltiplos lugares.

**Why this priority**: É pré-requisito bloqueante para qualquer tela do domínio financeiro
— nenhuma UI de movimentações pode ser construída sem essa camada.

**Independent Test**: Injetar `MovimentacaoFinanceiraService` em um componente/teste,
chamar cada um dos seis métodos com dados válidos e confirmar que a requisição HTTP
(método, URL, corpo e query params) corresponde ao contrato da API.

**Acceptance Scenarios**:

1. **Given** um `RequestRegistrarMovimentacaoDto` válido, **When** `registrar()` é chamado,
   **Then** o service executa `POST /movimentacoes-financeiras` com o DTO como corpo e
   retorna um `Observable<ResponseMovimentacaoDto>`.
2. **Given** um id de movimentação e uma data de pagamento, **When** `marcarComoPago()` é
   chamado, **Then** o service executa `PUT /movimentacoes-financeiras/{id}/marcar-como-pago`
   com `{ dataPagamento }` no corpo.
3. **Given** um id de movimentação e uma lista de ids de tags, **When** `associarTags()` é
   chamado, **Then** o service executa `PUT /movimentacoes-financeiras/{id}/tags` com
   `{ idsTags }` no corpo e retorna `Observable<void>`.
4. **Given** um id de movimentação, **When** `cancelar()` é chamado, **Then** o service
   executa `DELETE /movimentacoes-financeiras/{id}` e retorna `Observable<void>`.
5. **Given** um `GetMovimentacaoFiltroDto` com um subconjunto de campos preenchidos,
   **When** `consultar()` é chamado, **Then** o service executa
   `GET /movimentacoes-financeiras` incluindo como query param somente os campos do
   filtro que não são `undefined`/`null`, retornando `Observable<ResponseMovimentacaoDto[]>`.
6. **Given** uma competência (obrigatória) e opcionalmente um id de painel, **When**
   `obterAgregacao()` é chamado, **Then** o service executa
   `GET /movimentacoes-financeiras/agregacao` com `competencia` sempre presente e
   `idPainel` presente apenas quando informado, retornando
   `Observable<AgregacaoFinanceiraDto>`.
7. **Given** qualquer um dos seis métodos, **When** a API responde com erro HTTP, **Then**
   o `Observable` propaga o erro (nenhum tratamento/mascaramento é feito no service —
   fica a cargo do consumidor), replicando o padrão já usado em `painel.service.ts`.

### Edge Cases

- Campos opcionais do `GetMovimentacaoFiltroDto` ausentes não devem gerar query params
  vazios (`chave=`) — apenas campos com valor definido entram na query string.
- `obterAgregacao()` sem `idPainel` deve enviar a requisição apenas com `competencia`,
  sem quebrar nem enviar `idPainel=undefined`.
- Enums (`TipoMovimentacao`, `StatusMovimentacao`) são numéricos (espelham os enums C# da
  API por índice: `Despesa = 0`/`Receita = 1`; `Pendente = 0`/`Pago = 1`), não strings —
  qualquer consumidor deve serializá-los/compará-los como número.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor um `MovimentacaoFinanceiraService` (`providedIn: 'root'`)
  com `baseUrl` apontando para `${environment.apiUrl}/movimentacoes-financeiras`.
- **FR-002**: O sistema MUST expor `registrar(dto: RequestRegistrarMovimentacaoDto):
  Observable<ResponseMovimentacaoDto>` fazendo `POST` na `baseUrl`.
- **FR-003**: O sistema MUST expor `marcarComoPago(id: string, dataPagamento: string):
  Observable<ResponseMovimentacaoDto>` fazendo `PUT` em `{baseUrl}/{id}/marcar-como-pago`.
- **FR-004**: O sistema MUST expor `associarTags(id: string, idsTags: string[]):
  Observable<void>` fazendo `PUT` em `{baseUrl}/{id}/tags`.
- **FR-005**: O sistema MUST expor `cancelar(id: string): Observable<void>` fazendo
  `DELETE` em `{baseUrl}/{id}`.
- **FR-006**: O sistema MUST expor `consultar(filtro: GetMovimentacaoFiltroDto):
  Observable<ResponseMovimentacaoDto[]>` fazendo `GET` na `baseUrl`, convertendo cada
  campo definido do filtro em um `HttpParams` (ignorando `undefined`/`null`).
- **FR-007**: O sistema MUST expor `obterAgregacao(competencia: number, idPainel?: string):
  Observable<AgregacaoFinanceiraDto>` fazendo `GET` em `{baseUrl}/agregacao`, com
  `competencia` sempre enviado e `idPainel` enviado somente quando informado.
- **FR-008**: O sistema MUST definir os enums `TipoMovimentacao` (`Despesa = 0`,
  `Receita = 1`) e `StatusMovimentacao` (`Pendente = 0`, `Pago = 1`) espelhando os enums
  da API por valor numérico.
- **FR-009**: O sistema MUST definir as interfaces `TagDto`, `ResponseMovimentacaoDto`,
  `RequestRegistrarMovimentacaoDto`, `RequestMarcarComoPagoDto`,
  `RequestAssociarTagsDto`, `GetMovimentacaoFiltroDto` e `AgregacaoFinanceiraDto`
  espelhando os DTOs equivalentes da `api-dashfinras`, incluindo os campos opcionais
  (`observacao?`, `dataPagamento?`, `dataCancelamento?`, `alteradoPor?`, `alteradoEm?`,
  `tags?`, e todos os campos de `GetMovimentacaoFiltroDto`).
- **FR-010**: O sistema MUST cobrir cada um dos seis métodos do service com testes
  unitários de sucesso e de erro, seguindo o padrão de teste HTTP já usado em
  `painel.service.spec.ts`/`convite.service.spec.ts`.

### Key Entities *(include if feature involves data)*

- **ResponseMovimentacaoDto**: representação de uma movimentação financeira retornada pela
  API — id, painel, tipo (despesa/receita), categoria, competência (AAAAMM numérico),
  valor, status (pendente/pago), datas de pagamento/cancelamento, auditoria
  (criado/alterado por e em) e tags associadas.
- **RequestRegistrarMovimentacaoDto**: payload para criar uma movimentação (painel, tipo,
  categoria, competência, valor, observação opcional).
- **GetMovimentacaoFiltroDto**: conjunto de filtros opcionais para consulta (painel,
  competência, categoria, tag, status, intervalo de datas).
- **AgregacaoFinanceiraDto**: totais agregados de uma competência (total de receitas,
  total de despesas, saldo).
- **TagDto**: etiqueta associável a uma movimentação (id, dono opcional, nome, data de
  criação).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos seis métodos do `MovimentacaoFinanceiraService` chamam a URL,
  verbo HTTP e corpo/params corretos, verificado por teste unitário automatizado.
- **SC-002**: 100% dos seis métodos possuem teste de sucesso e teste de erro
  (`ng test` verde, sem regressão nos specs já existentes do projeto).
- **SC-003**: Nenhuma tela ou componente consome diretamente `HttpClient` para o domínio de
  movimentações financeiras — toda chamada passa pelo service.

## Assumptions

- Os DTOs e o endpoint `/movimentacoes-financeiras` já existem e estão estáveis na
  `api-dashfinras` (modelo de movimentações financeiras, PR #39 daquele repositório) — esta
  entrega apenas espelha o contrato já publicado, sem propor mudanças de contrato.
  As chaves brutas nesta pasta (json/tls) permanecem fora do escopo.
- Não há componente/tela consumindo este service ainda nesta entrega — é uma camada de
  infraestrutura isolada, preparando o terreno para as telas de lançamento/consulta
  financeira que serão especificadas em uma feature futura.
- Segue exatamente o padrão arquitetural já estabelecido por `painel.service.ts` e
  `convite.service.ts` (service `providedIn: 'root'`, `baseUrl` derivado de
  `environment.apiUrl`, métodos finos que apenas encapsulam a chamada HTTP, sem lógica de
  negócio nem tratamento de erro no próprio service).
