# Phase 1 Data Model: Remover usuário e alterar papel no painel

Nenhuma entidade nova. Esta feature opera sobre entidades já definidas na spec 002
(`core/models/painel.model.ts`), adicionando apenas o DTO de requisição para a alteração de papel.

## Entidades existentes (reaproveitadas, sem alteração de formato)

### `ResponsePainelDto`

```ts
export interface ResponsePainelDto {
  id: string;
  nome?: string;
  usuarios?: PainelUsuarioDto[];
}
```

Retornado por `PainelService.obterPainel` e, no fluxo desta feature, também pelo endpoint de
remoção (`DELETE .../usuario/{idUsuario}` retorna o painel atualizado) — usado para atualizar a
lista de membros no signal `painel` sem uma segunda chamada de rede.

### `PainelUsuarioDto`

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

Cada linha do modal "Usuários do painel" já usa esta entidade (`painel.usuarios`). Os novos
controles (remover, alterar papel) atuam sobre `usuario.id` e `usuario.idPermissao` já
disponíveis — nenhum campo novo necessário na leitura.

### `PainelPermissao`

```ts
export enum PainelPermissao {
  Dono = 0,
  Administrador = 1,
  Membro = 2,
  Visualizador = 3
}
```

O seletor de alteração de papel oferece apenas `Administrador`, `Membro`, `Visualizador` como
opções — `Dono` nunca é selecionável (FR-009), reaproveitando a mesma constante `PAPEIS_CONVITE`
já usada no formulário de adicionar usuário (`painel-criar.ts`), que já exclui `Dono`.

## Entidade nova (request)

### `RequestEditarPermissaoUsuarioPainelDto` (novo, em `painel.model.ts`)

```ts
export interface RequestEditarPermissaoUsuarioPainelDto {
  permissao: PainelPermissao;
}
```

- **Campos**: `permissao` — novo papel desejado para o usuário-alvo, um dos valores de
  `PainelPermissao` exceto `Dono`.
- **Validação client-side**: nenhuma além de garantir que o valor selecionado vem da lista de
  opções já filtrada (sem `Dono`) — a API rejeita (`PAINEL_NO_PERMISSION_EDIT_USER_PERMISSION`)
  qualquer tentativa inválida (auto-edição, alvo Dono, ou `novaPermissao == Dono`) como reforço
  de defesa em profundidade.
- **Relacionamento**: enviado no corpo de `PUT /api/painel/{id}/usuario/{idUsuario}/permissao`;
  não persiste nada no cliente — a resposta (`ResponsePainelDto`) é a fonte de verdade após
  sucesso.

## Remoção (sem corpo de requisição)

`DELETE /api/painel/{id}/usuario/{idUsuario}` não tem DTO de requisição — os dois IDs (painel,
usuário-alvo) já identificam a operação via URL. Nenhuma entidade nova necessária.
