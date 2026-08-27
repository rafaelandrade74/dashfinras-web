# Phase 0 Research: Remover usuário e alterar papel no painel

Nenhum `[NEEDS CLARIFICATION]` restou no `spec.md`. Esta fase documenta as decisões técnicas
tomadas a partir da investigação do backend (`api-dashfinras`, repo irmão) e do frontend existente
(spec 002), que fundamentam o `plan.md`.

## Decisão: Endpoints e contrato reaproveitados sem alteração

- **Decision**: Consumir `DELETE /api/painel/{id}/usuario/{idUsuario}` para remoção e
  `PUT /api/painel/{id}/usuario/{idUsuario}/permissao` (body `{ permissao: PainelPermissao }`)
  para alteração de papel — ambos já implementados em `api-dashfinras` (PR #45), sem necessidade
  de mudança de contrato.
- **Rationale**: Endpoints já existem, já implementam exatamente as regras de negócio descritas
  no `spec.md` (Dono nunca removível/alterável, quem remove precisa ser Dono/Adm ou o próprio
  alvo, quem altera papel precisa ser Dono/Adm e não pode alterar o próprio papel nem promover a
  Dono — ver `PainelRepository.RemoveUsuarioPainelAsync`/`UpdatePermissaoUsuarioPainelAsync` em
  `api-dashfinras`). Ambos retornam `ResponsePainelDto` atualizado (remoção) ou o mesmo formato
  (alteração), dispensando uma nova chamada de `obterPainel` após sucesso.
- **Alternatives considered**: Nenhuma — não há endpoint alternativo, e reimplementar as regras de
  permissão no cliente além de ocultar controles seria duplicar lógica que a API já garante (e
  ainda ficaria dessincronizado se a API mudar as regras).

## Decisão: Tratamento de erros de negócio

- **Decision**: Mapear falhas das duas chamadas usando o mesmo padrão já usado em
  `painel-detalhe.ts` (`erros[0]?.descricao ?? '<mensagem amigável padrão>'`), lendo o array
  `Erro[]` do corpo da resposta de erro.
- **Rationale**: Os códigos de erro da API (`PAINEL_USUARIO_NOT_LINKED`,
  `PAINEL_NO_PERMISSION_REMOVE_USER`, `PAINEL_NO_PERMISSION_EDIT_USER_PERMISSION`) já vêm com
  `descricao` amigável pronta para exibição — não há necessidade de um mapeamento client-side por
  código, apenas de exibir a mensagem retornada e permitir nova tentativa (mesmo padrão de
  `confirmarExcluir`/`adicionarUsuario`).
- **Alternatives considered**: Mapear cada código para uma mensagem customizada no frontend —
  rejeitado por adicionar complexidade sem ganho, já que a API já entrega texto adequado.

## Decisão: Confirmação de remoção

- **Decision**: Reaproveitar o mesmo padrão de modal de confirmação já usado para excluir o
  painel (`excluirAberto`/`excluindo`/`erroExcluir` em `painel-detalhe.ts`), instanciando um
  estado equivalente para remoção de usuário (guardando qual usuário está sendo removido).
- **Rationale**: Consistência visual e de código com o único outro fluxo destrutivo já existente
  na mesma tela; nenhum novo padrão de UI a introduzir.
- **Alternatives considered**: Confirmação inline (ex.: botão vira "confirmar?" por 3s) —
  rejeitada por ser um padrão não usado em nenhum outro lugar do app.

## Decisão: Alteração de papel sem confirmação adicional

- **Decision**: A troca de papel é aplicada diretamente ao selecionar a nova opção (sem modal de
  confirmação), como uma ação reversível (o papel pode ser trocado de volta a qualquer momento
  por quem tem permissão).
- **Rationale**: `spec.md` não pede confirmação para esta ação (diferente da remoção, que é
  potencialmente mais impactante — tira acesso). Reduz atrito para a ação mais frequente
  (ajustar papel) mantendo o controle mais pesado (confirmação) apenas para a ação destrutiva.
- **Alternatives considered**: Confirmar toda alteração de papel — rejeitada por não ser exigida
  pelo spec e por adicionar fricção a uma ação corrigível a qualquer momento.
