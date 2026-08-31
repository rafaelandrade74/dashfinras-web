# Data Model: Redirecionamento de login/cadastro ao responder convite

Esta feature não introduz nem altera entidades de dados — ela apenas reordena quando o frontend
acessa entidades e endpoints que já existem. Documentado aqui apenas para referência, sem novos
campos ou estados.

## Convite (existente — `core/models/convite.model.ts`)

- Identificado por `token` (parâmetro de rota `/convites/:token`).
- Estados relevantes já tratados pelo `ConviteResponder` via código de erro da API:
  `CONVITE_EXPIRED`, `CONVITE_ALREADY_RESOLVED`, `CONVITE_NOT_FOUND`, ou sucesso (`ResponseConviteDto`
  pendente).
- **Sem mudança**: esta feature não adiciona nem remove estados; apenas garante que a consulta ao
  convite só acontece com sessão/cadastro já válidos (ver [research.md](research.md), Decisão 2).

## Sessão do usuário (existente — `AuthService`, cookie `df_session`)

- `AuthService.isAuthenticated` reflete a sessão validada por `GET /api/auth/session`.
- **Sem mudança**: consumida pelo `authGuard` já existente, agora aplicado também à rota de
  convite.

## Cadastro de usuário (existente — `AccountService.obterUsuario()`)

- Erro `USER_NOT_FOUND` indica que a sessão Supabase existe mas o perfil de aplicação ainda não foi
  criado.
- **Sem mudança**: consumido pelo `accountGuard` já existente, agora aplicado também à rota de
  convite.

## Relação entre as três entidades nesta feature

```text
Sessão ausente  ──authGuard──▶ /login?redirectUrl=/convites/:token
Sessão OK, sem cadastro ──accountGuard──▶ /completar-cadastro?redirectUrl=/convites/:token
Sessão OK + cadastro OK ──▶ ConviteResponder carrega o Convite pelo token normalmente
```

Nenhuma migração, nenhum novo campo de persistência e nenhuma alteração de contrato de API são
necessárias.
