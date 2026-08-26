# Contract: Endpoints de Convite (api-dashfinras)

Todos os endpoints abaixo já existem e estão implementados no backend (`api-dashfinras`, ver
`v1.json` na raiz deste repositório) — este documento apenas fixa o contrato tal como o frontend vai
consumi-lo via `ConviteService` (`core/services/convite.service.ts`, novo), no mesmo padrão de
`PainelService`. Nenhuma alteração de backend faz parte desta feature.

Todas as chamadas passam pelo proxy same-origin `/api/*` do BFF (`src/server/api-proxy.ts`), que já
injeta o `Authorization: Bearer` a partir da sessão — o frontend nunca monta esse header manualmente
(mesmo padrão de `PainelService`).

## POST /api/painel/{id}/convites

Cria um convite para associar um usuário (por e-mail) a um painel.

- **Path param**: `id` — GUID do painel.
- **Body**: `RequestCriarConviteDto` (ver `data-model.md`) — `email`, `permissao`, `urlFrontend`.
- **200**: `ResponseConviteDto`.
- **400/500**: `Erro[]`.
- **Uso no frontend**: chamado uma vez por e-mail pendente, em paralelo (`forkJoin`), imediatamente
  após `POST /api/painel` retornar o painel criado (US1, FR-006). Também usado para "reenviar" um
  convite Recusado/Expirado (US4, FR-019), com o mesmo e-mail/papel do convite original.

## GET /api/painel/{id}/convites

Lista os convites enviados para um painel.

- **Path param**: `id` — GUID do painel.
- **200**: `ResponseConvitesDto`.
- **400/500**: `Erro[]`.
- **Uso no frontend**: carregado ao abrir a aba "Convites enviados" na tela de detalhe do painel
  (US4, FR-017/FR-018), somente quando o usuário autenticado é o dono do painel.

## GET /api/convites/{token}

Consulta os dados de um convite pelo token do link (documentado como "sem autenticação").

- **Path param**: `token` — token do convite (string, vindo da query string do link de e-mail).
- **200**: `ResponseConviteDto` — **apenas quando o convite ainda está pendente**
  (`status = PendenteCadastro` ou `PendenteAprovacao`).
- **400**: `Erro[]` com um `codigo` — confirmado contra o código-fonte
  (`ConviteService.ObterPorTokenAsync` + `AplicarExpiracaoSeNecessarioAsync`):
  - `CONVITE_NOT_FOUND` — token inexistente (FR-014)
  - `CONVITE_EXPIRED` — expirado (FR-012)
  - `CONVITE_ALREADY_RESOLVED` — já foi aceito, recusado ou invalidado (FR-013)
- **Uso no frontend**: chamado ao abrir `/convites/:token`, antes de qualquer verificação de sessão
  (US2, FR-008). Diferente do assumido inicialmente, os estados "expirado" e "já respondido" **não**
  vêm como `status` em um corpo 200 — vêm como erro 400, distinguidos pelo `codigo` acima (ver
  `data-model.md` para o detalhe completo).

## POST /api/convites/{token}/aprovar

Aprova um convite recebido por e-mail (usuário já cadastrado/autenticado).

- **Path param**: `token`.
- **200**: `ResponseConviteDto` (com `status = Concluido`); exige que o convite esteja em
  `PendenteAprovacao` — se estiver em `PendenteCadastro`, `AlreadyResolved`, expirado etc., retorna
  400 `CONVITE_ALREADY_RESOLVED`.
- **400/401/500**: `Erro[]` / `ProblemDetails`.
- **Uso no frontend**: chamado ao clicar "Aceitar" em `/convites/:token` (US2/US3, FR-010/FR-015).
  Requer sessão ativa — se o usuário não estiver autenticado, o frontend redireciona para
  `/login?redirectUrl=/convites/:token` antes de permitir o clique (ver `research.md`, Decisão 2).

## POST /api/convites/{token}/recusar

Recusa um convite recebido por e-mail (usuário já cadastrado/autenticado).

- **Path param**: `token`.
- **200**: `ResponseConviteDto` (com `status = Recusado`); mesma exigência de `PendenteAprovacao`
  descrita acima para `aprovar`.
- **400/401/500**: `Erro[]` / `ProblemDetails`.
- **Uso no frontend**: chamado ao clicar "Recusar" em `/convites/:token` (US2/US3, FR-011/FR-016).
  Mesma exigência de sessão que `aprovar`.

## Resumo do serviço Angular (`ConviteService`)

```ts
@Injectable({ providedIn: 'root' })
export class ConviteService {
  criarConvite(idPainel: string, dto: RequestCriarConviteDto): Observable<ResponseConviteDto>;
  listarConvites(idPainel: string): Observable<ResponseConvitesDto>;
  obterConvitePorToken(token: string): Observable<ResponseConviteDto>;
  aprovarConvite(token: string): Observable<ResponseConviteDto>;
  recusarConvite(token: string): Observable<ResponseConviteDto>;
}
```

Espelha exatamente a superfície acima, no mesmo padrão de `PainelService` (baseUrl +
métodos finos de `HttpClient`, sem lógica de negócio no serviço).
