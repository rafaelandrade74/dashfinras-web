# Research: Redirecionamento de login/cadastro ao responder convite

Nenhum item da Technical Context ficou marcado como `NEEDS CLARIFICATION` — o comportamento
necessário já existe, quase integralmente, em outras partes do app. Este documento registra as
decisões tomadas ao mapear a spec para a infraestrutura já existente.

## Decisão 1: Reusar `authGuard` + `accountGuard` na rota `/convites/:token`

- **Decision**: Aplicar `canActivate: [authGuard, accountGuard]` à rota `convites/:token` em
  `app-routing-module.ts`, na mesma ordem já usada pela rota `/paineis`.
- **Rationale**: `authGuard` já redireciona para `/login?redirectUrl=<url atual>` quando não há
  sessão (`src/app/core/guards/auth.guard.ts`); `accountGuard` já redireciona para
  `/completar-cadastro?redirectUrl=<url atual>` quando a API retorna `USER_NOT_FOUND`
  (`src/app/core/guards/account.guard.ts`). Isso cobre FR-001 a FR-004 sem nenhum código novo,
  preservando o token do convite dentro do próprio `redirectUrl` (o path completo
  `/convites/:token` é o `state.url` usado pelos guards).
- **Alternatives considered**:
  - Implementar a checagem de sessão/cadastro dentro do próprio `ConviteResponder` (como já era
    feito parcialmente para autenticação): rejeitada por duplicar lógica já centralizada nos
    guards, divergindo do padrão usado no resto do app e arriscando comportamento inconsistente
    (ex.: o `accountGuard` equivalente nunca foi implementado ali).
  - Criar um guard novo específico para convites: rejeitada por ser desnecessária — os guards
    existentes já são genéricos o suficiente (dependem apenas de `state.url`, não de nada
    específico de painel).

## Decisão 2: Ordem guard → carregamento do convite (auth sempre antes da validade do token)

- **Decision**: Como os guards resolvem antes do componente `ConviteResponder` ser instanciado, o
  `ngOnInit` do componente só executa com sessão e cadastro já garantidos; a consulta
  `GET /api/convite/:token` (que hoje falha com 401 para usuários não autenticados) volta a ser
  chamada apenas em um contexto autenticado, e seu retorno de erro (convite expirado / já
  respondido / inexistente) volta a refletir o estado real do convite em vez de um 401 mascarado.
- **Rationale**: Corresponde exatamente à clarificação registrada na spec ("sempre autenticar
  primeiro"): a validade do convite só é conferida depois do login/cadastro.
- **Alternatives considered**: Validar o token publicamente antes de exigir login (endpoint sem
  Bearer) — rejeitada na clarificação por exigir um novo endpoint público na API, fora do escopo
  deste frontend e inconsistente com o modelo de autenticação atual (`api-dashfinras` valida Bearer
  em todas as rotas via JWKS).

## Decisão 3: Simplificar a checagem de auth ad-hoc em `ConviteResponder.responder()`

- **Decision**: Remover o bloco `await this.authService.waitUntilReady(); if
  (!this.authService.isAuthenticated) { ... }` dentro de `responder()`
  (`convite-responder.ts:113-119`), já que a rota garantida por `authGuard` torna esse branch
  inalcançável em uso normal.
- **Rationale**: Reduz código morto/confuso; evita que o componente pareça responsável por uma
  responsabilidade que passa a ser do guard. `AuthService.isAuthenticated` continua disponível se
  algum teste quiser simular uma expiração de sessão entre o carregamento da página e o clique em
  aceitar/recusar, mas esse caso já é tratado genericamente pelo tratamento de erro de
  `chamada().subscribe({ error: ... })` (a API responderia 401 e cairia no mesmo bloco de erro
  exibido hoje para outras falhas de comunicação).
- **Alternatives considered**: Manter o bloco como proteção defensiva extra — rejeitado por
  contradizer a diretriz do projeto de não adicionar fallback para cenários que não podem
  acontecer quando o guard já garante a pré-condição.

## Decisão 4: Nenhuma mudança na API (`api-dashfinras`)

- **Decision**: Este trabalho não introduz nem modifica nenhum endpoint da API; usa apenas
  `AccountService.obterUsuario()` (já consumido por `accountGuard`) e os endpoints de convite já
  existentes (`ConviteService.obterConvitePorToken`, `aprovarConvite`, `recusarConvite`).
- **Rationale**: A spec (Assumptions) já delimita que o contrato de aprovação/recusa é
  responsabilidade da API existente; a mudança aqui é puramente de sequenciamento no frontend.
