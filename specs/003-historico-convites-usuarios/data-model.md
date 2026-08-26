# Data Model: Histórico de convites no modal de usuários

Nenhum DTO novo. Reaproveita integralmente `core/models/convite.model.ts` (issue #23):
`ResponseConviteDto`, `ResponseConvitesDto`, `StatusConvite`, `RequestCriarConviteDto`.

## StatusConvite (reaproveitado, sem alteração)

```ts
export enum StatusConvite {
  PendenteCadastro = 0,
  PendenteAprovacao = 1,
  Concluido = 2,
  Recusado = 3,
  Expirado = 4,
  Invalidado = 5
}
```

Mapeamento label/cor por status a recriar em `painel-detalhe.ts` (ver `research.md`, Decisão 1):

| Status | Label exibido | Cor |
|---|---|---|
| `PendenteCadastro` / `PendenteAprovacao` | "Pendente" | accent (âmbar) |
| `Concluido` | "Aceito" | teal |
| `Recusado` | "Recusado" | danger |
| `Expirado` | "Expirado" | neutro (ink-faint) |
| `Invalidado` | "Invalidado" | neutro (ink-faint) |

Botão "Reenviar" (FR-004) aparece apenas para `Recusado`, `Expirado`, `Invalidado`.

## ResponseConviteDto / ResponseConvitesDto (reaproveitados, sem alteração)

```ts
export interface ResponseConviteDto {
  id: string;
  emailConvidado?: string;
  idPainel: string;
  nomePainel?: string;
  permissao: PainelPermissao;
  status: StatusConvite;
  dataCriacao: string;
  dataExpiracao: string;
}

export interface ResponseConvitesDto {
  convites: ResponseConviteDto[];
}
```

Fonte da aba "Convites enviados" (`ConviteService.listarConvites(idPainel)`).

## Estado local do modal (extensão do já existente na issue #22)

```ts
type AbaModalUsuarios = 'usuarios' | 'convites';

interface ConvitesTabState {
  abaAtiva: AbaModalUsuarios;
  convites: ResponseConviteDto[];
  convitesCarregados: boolean;      // já buscou pelo menos uma vez nesta sessão do modal
  carregandoConvites: boolean;
  erroConvites?: string;
  reenviandoConviteId?: string;     // id do convite em reenvio, se houver
}
```

`convitesCarregados` é o que implementa o carregamento lazy (research.md, Decisão 2): a troca de
aba só dispara `listarConvites` se `convitesCarregados` ainda for `false`.

## Relações

```text
Painel (1) ── (0..N) Convite            [já existente, issue #23]
   │
   └── modal "Usuários do painel" (issue #22)
         ├── aba "Usuários"           → painel().usuarios (já existente)
         └── aba "Convites enviados"  → ConviteService.listarConvites(painel.id)  [esta feature]
```
