# Data Model: Convite de usuário por e-mail

Modelos do lado frontend (TypeScript), espelhando os DTOs da API (`api-dashfinras`, `v1.json`) no
padrão já usado em `core/models/painel.model.ts`. Nenhuma persistência local além de estado de
componente (signals) — a fonte de verdade é sempre a API.

## PainelPermissao (reaproveitado, sem alteração)

Já existe em `core/models/painel.model.ts`:

```ts
export enum PainelPermissao {
  Dono = 0,
  Administrador = 1,
  Membro = 2,
  Visualizador = 3
}
```

O seletor de papel no convite oferece apenas `Administrador`, `Membro`, `Visualizador` — `Dono`
nunca é uma opção de convite (Assumption do spec).

## StatusConvite (novo)

**Confirmado contra o código-fonte real do backend** (`api-dashfinras`, não apenas o `v1.json`, que
não documentava os valores do enum) —
`src/DashFinRas/Extensions/Dto/Default/StatusConvite.cs`. O enum tem 6 valores, não 4 como o design
inicial assumia — dois estágios de "pendente" distintos (a depender de a conta já existir ou não no
momento da criação do convite):

```ts
export enum StatusConvite {
  PendenteCadastro = 0,   // e-mail convidado ainda não tem conta — resolvido automaticamente
                          // quando a pessoa completa o cadastro com esse e-mail
  PendenteAprovacao = 1,  // e-mail já tem conta — aguardando clique em Aceitar/Recusar
  Concluido = 2,          // aceito
  Recusado = 3,
  Expirado = 4,
  Invalidado = 5
}
```

Na UI, `PendenteCadastro` e `PendenteAprovacao` são tratados como "Pendente" (mesmo rótulo/cor na
aba "Convites enviados"); `Invalidado` reaproveita o visual de "Expirado".

## RequestCriarConviteDto (novo)

Espelha `RequestCriarConviteDto` (`v1.json`): `email`, `permissao`, `urlFrontend` — os 3 campos são
obrigatórios no schema (`required: [email, permissao, urlFrontend]`).

```ts
export interface RequestCriarConviteDto {
  email: string;
  permissao: PainelPermissao;
  urlFrontend: string;
}
```

- **email**: e-mail do convidado, validado no formulário antes do envio (FR-002).
- **permissao**: papel oferecido — Administrador, Membro ou Visualizador.
- **urlFrontend**: URL da página de resposta ao convite (`/convites/:token`, ver Decisão 2 em
  `research.md`) que a API anexa o `?token=...` para compor o link do e-mail. Montada a partir de
  `window.location.origin` (ou constante de ambiente equivalente já usada em outros pontos do app)
  + `/convites`.

## ResponseConviteDto (novo)

Espelha `ResponseConviteDto`: dados de um convite individual, usados tanto na tela pública de
resposta quanto em cada linha da lista "Convites enviados".

```ts
export interface ResponseConviteDto {
  id: string;
  emailConvidado?: string;
  idPainel: string;
  nomePainel?: string;
  permissao: PainelPermissao;
  status: StatusConvite;
  dataCriacao: string;   // ISO date-time
  dataExpiracao: string; // ISO date-time
}
```

**Confirmado contra o código-fonte real** (`Dto/Convite/ResponseConviteDto.cs`): o campo "quem
convidou" **não existe** neste DTO. A entidade `ConvitePainel` guarda apenas `IdUsuarioSolicitante`
(GUID, via navegação `UsuarioSolicitanteNavigation`) — nunca exposto na resposta da API. A hipótese
levantada na clarificação de 2026-08-25 ("o backend já sabe quem convidou pelo token") está correta
sobre o *domínio* (a entidade sabe), mas essa informação não chega ao frontend por este endpoint.
**Decisão de implementação**: a tela pública de convite (`convite-responder`) mostra apenas painel e
papel oferecido, sem nomear quem convidou — `FR-008` foi cumprido parcialmente (o requisito "quem a
convidou" não é atendível sem mudança de backend, fora de escopo desta entrega). Reportar esse gap
ao dono do produto como possível ajuste futuro do `ResponseConviteDto`.

### Comportamento real de `GET /api/convites/{token}` (diferente do assumido no research.md)

**Confirmado contra o código-fonte** (`Services/ConviteService.cs:109-114`,
`AplicarExpiracaoSeNecessarioAsync`): o `GET` **só retorna 200** enquanto o convite está em
`PendenteCadastro` ou `PendenteAprovacao`. Assim que o convite expira, é recusado, aceito ou fica
inválido, o próprio `GET` passa a lançar `BusinessException` (400, `Erro[]`) — **não** existe um
retorno 200 com `status: Expirado/Recusado/Concluido`. Os códigos de erro relevantes
(`Errors/BusinessErrors.cs`) são:

- `CONVITE_NOT_FOUND` — token inexistente
- `CONVITE_EXPIRED` — expirado (o backend também marca o registro como `Expirado` nesse momento)
- `CONVITE_ALREADY_RESOLVED` — já foi aceito, recusado ou invalidado

O frontend (`convite-responder.ts`) distingue esses três casos pelo `codigo` do primeiro item do
array `Erro[]`, não pelo corpo de uma resposta 200. As telas "convite expirado" e "convite já
respondido" do design (artboard 02/03) são, portanto, renderizadas a partir do estado de **erro**
da chamada GET, não de um campo `status` em uma resposta de sucesso.

## ResponseConvitesDto (novo)

Espelha `ResponseConvitesDto` — lista de convites de um painel, usada na aba "Convites enviados".

```ts
export interface ResponseConvitesDto {
  convites: ResponseConviteDto[];
}
```

## Erro (reaproveitado, sem alteração)

Já existe em `core/models/erro.model.ts` — usado para parsear `error.error` como `Erro[]` nos
tratamentos de falha (FR-021), no mesmo padrão de `painel-criar.ts`.

## Estado local — "usuário convidado (pendente)" (não é um DTO da API)

Existe apenas dentro do componente `painel-criar` enquanto o painel ainda não foi criado —
descartado (nunca persistido) após o submit. Não corresponde a nenhum schema do backend.

```ts
interface ConvitePendente {
  email: string;
  permissao: PainelPermissao; // Administrador | Membro | Visualizador
}
```

Regras de validação sobre este estado (ver `spec.md`):
- `email` deve passar em validação de formato (FR-002) antes de ser adicionado à lista.
- `email` não pode duplicar outro já presente na lista (FR-003).
- `email` não pode ser igual ao e-mail do usuário autenticado (FR-004).

## Relações

```text
Painel (1) ── (0..N) Convite ── (1) e-mail do convidado
   │
   └── dono (1) ── (0..N) Convite disparados
```

Um `Convite` sempre referencia exatamente um `Painel` (`idPainel`) e um e-mail (`emailConvidado`).
Não há aqui modelagem de "múltiplos convites simultâneos pendentes" para o mesmo par
e-mail/painel — por Assumption do spec, o convite mais recente é a referência ativa.
