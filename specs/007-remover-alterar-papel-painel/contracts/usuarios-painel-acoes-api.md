# Contract: Endpoints consumidos por "Remover usuário e alterar papel no painel"

Ambos os endpoints abaixo foram adicionados à `api-dashfinras` no PR #45 (repo irmão), fechando a
lacuna documentada em `specs/002-gerenciar-usuarios-painel/contracts/usuarios-painel-api.md` ›
"Endpoints necessários mas inexistentes". Confirmados contra o código-fonte real
(`PainelController.cs`, `PainelService.cs`, `PainelRepository.cs`), não apenas contra a spec da
API.

## DELETE /api/painel/{id}/usuario/{idUsuario}

Remove o vínculo de `idUsuario` com o painel `id`.

- **Novo método de serviço**: `PainelService.removerUsuarioPainel(idPainel: string, idUsuario: string): Observable<ResponsePainelDto>`
- **Resposta de sucesso (200)**: `ResponsePainelDto` — o painel atualizado, já sem o usuário
  removido em `usuarios`. Usado para atualizar o signal `painel` diretamente, sem chamada extra a
  `obterPainel`.
- **Regras de negócio aplicadas pela API** (não reimplementar no cliente, apenas refletir
  ocultando controles — ver `data-model.md` e `research.md`):
  - 404/erro de negócio (`PAINEL_USUARIO_NOT_LINKED`) se `idUsuario` não é membro do painel.
  - Erro de negócio (`PAINEL_NO_PERMISSION_REMOVE_USER`) se o alvo é o Dono, ou se quem chama não
    é Dono/Administrador do painel e não é o próprio `idUsuario` (autorremoção sempre permitida,
    exceto para o Dono).
- **Uso nesta feature**: acionado pelo controle "Remover" de cada linha (exceto a do Dono), após
  confirmação do usuário (US1).

## PUT /api/painel/{id}/usuario/{idUsuario}/permissao

Altera o papel (`PainelPermissao`) de `idUsuario` no painel `id`.

- **Novo método de serviço**: `PainelService.editarPermissaoUsuarioPainel(idPainel: string, idUsuario: string, permissao: PainelPermissao): Observable<ResponsePainelDto>`
- **Corpo da requisição**: `RequestEditarPermissaoUsuarioPainelDto { permissao: PainelPermissao }`
  (novo DTO, ver `data-model.md`) — nunca `PainelPermissao.Dono`.
- **Resposta de sucesso (200)**: `ResponsePainelDto` atualizado, com o novo papel refletido em
  `usuarios[].idPermissao`.
- **Regras de negócio aplicadas pela API**:
  - Erro de negócio (`PAINEL_USUARIO_NOT_LINKED`) se `idUsuario` não é membro do painel.
  - Erro de negócio (`PAINEL_NO_PERMISSION_EDIT_USER_PERMISSION`) se o alvo é o Dono, se
    `permissao` enviada é `Dono`, se `idUsuario` é o próprio usuário logado, ou se quem chama não
    é Dono/Administrador do painel.
- **Uso nesta feature**: acionado pelo seletor de papel de cada linha (exceto a do Dono e a do
  próprio usuário logado), aplicado diretamente na seleção, sem confirmação adicional (US2).

## Tratamento de erro (ambos os endpoints)

Mesmo padrão já usado em `painel-detalhe.ts` para `deletarPainel`/`criarConvite`: ler
`(error?.error ?? []) as Erro[]` e exibir `erros[0]?.descricao` com uma mensagem padrão de
fallback, mantendo o estado anterior na tela e permitindo nova tentativa (ver `research.md` ›
Decisão "Tratamento de erros de negócio").
