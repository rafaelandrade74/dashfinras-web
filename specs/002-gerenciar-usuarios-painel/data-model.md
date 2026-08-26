# Data Model: Gerenciar usuários do painel

Nenhum DTO novo. Esta feature reaproveita integralmente os modelos já existentes de
`core/models/painel.model.ts` (issue #19) e `core/models/convite.model.ts` (issue #23).

## PainelUsuarioDto (reaproveitado, sem alteração)

```ts
export interface PainelUsuarioDto {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  idPermissao?: PainelPermissao;
  noPermissao?: string;
}
```

Fonte da lista exibida no modal (`painel().usuarios`). `idPermissao` decide o badge de papel
exibido (mesmo `PAPEL_INFO`/lookup de label já usado em `painel-detalhe.ts` para o badge do
usuário logado no cabeçalho — reaproveitado aqui por linha da lista).

## RequestCriarConviteDto / ResponseConviteDto (reaproveitados, sem alteração)

Já definidos em `core/models/convite.model.ts` (issue #23):

```ts
export interface RequestCriarConviteDto {
  email: string;
  permissao: PainelPermissao;
  urlFrontend: string;
}
```

Usado pelo bloco "adicionar usuário" deste modal, chamando `ConviteService.criarConvite(idPainel,
dto)` — o mesmo método já usado em `painel-criar.ts`.

## Estado local do modal (não é um DTO da API)

```ts
interface UsuariosModalState {
  aberto: boolean;
  adicionando: boolean;
  erroAdicionar?: string;
}
```

- `aberto`: controla a visibilidade do modal (signal), acionado pelo botão "Usuários".
- `adicionando`/`erroAdicionar`: mesmo padrão de `salvando`/`mensagemErro` já usado nos modais
  "Renomear"/"Excluir" de `painel-detalhe.ts`.

O formulário de adição (e-mail + papel) usa `FormGroup` reativo, no mesmo padrão do bloco
equivalente em `painel-criar.ts` (issue #23) — sem estado de "lista de pendentes" aqui, porque a
adição é imediata (uma chamada por clique), não em lote antes de um submit final.

## Regras de validação (client-side, antes de chamar a API)

Reaproveitadas de `painel-criar.ts` (issue #23), com a comparação de duplicidade ajustada pra
esta tela:

- **Formato de e-mail** (FR-005): mesma regex já usada em `painel-criar.ts`.
- **Não pode ser o próprio usuário logado** (FR-006): comparar com `accountService.usuarioAtual?.email`.
- **Não pode duplicar um membro já existente** (FR-007): comparar com `painel().usuarios` (por
  `email`), não com uma lista de pendentes local — diferença chave em relação à issue #23, onde a
  comparação era contra a lista de pendentes ainda não confirmada.

## Relações

```text
Painel (1) ── (0..N) PainelUsuarioDto   (já existente — issue #19)
   │
   └── adicionar usuário (por e-mail) ── reaproveita Convite (issue #23), sem entidade nova
```
