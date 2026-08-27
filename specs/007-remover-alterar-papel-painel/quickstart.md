# Quickstart: Validar remover usuário e alterar papel no painel

Guia para validar manualmente o fluxo depois de implementado. Pressupõe `api-dashfinras` (com o
PR #45 mergeado — endpoints `DELETE .../usuario/{idUsuario}` e `PUT .../usuario/{idUsuario}/permissao`
disponíveis) e o BFF deste repo rodando localmente (`npm run start:dev`), e um painel de teste com
múltiplos usuários em papéis diferentes (montar com o fluxo de convite da issue #23, como na spec
002).

## Cenário 1 — Remover um membro (US1)

1. Logado como Dono de um painel com pelo menos 3 usuários (Dono + 2 outros papéis), abrir o modal
   "Usuários do painel".
2. Acionar o controle de remover em um usuário com papel Membro.
3. **Esperado**: sistema pede confirmação.
4. Confirmar.
5. **Esperado**: sem fechar o modal, o usuário removido desaparece da lista imediatamente.

## Cenário 2 — Dono nunca é removível (FR-006)

1. Com o modal aberto, inspecionar a linha do Dono do painel.
2. **Esperado**: nenhum controle de remoção aparece nessa linha, independentemente de quem está
   logado (Dono ou Administrador).

## Cenário 3 — Auto-remoção (sair do painel) (US1, cenário 3)

1. Logado como um Administrador (não Dono) de um painel, abrir o modal "Usuários do painel".
2. Acionar o controle de remover na própria linha.
3. **Esperado**: sistema pede confirmação.
4. Confirmar.
5. **Esperado**: modal fecha; o painel deixa de estar acessível/listado para esse usuário (ele não
   é mais membro).

## Cenário 4 — Alterar o papel de um membro (US2)

1. Logado como Dono, abrir o modal "Usuários do painel" de um painel com um usuário Membro.
2. Selecionar "Administrador" no controle de papel desse usuário.
3. **Esperado**: nada é salvo ainda — nenhuma chamada de rede ocorre só pela seleção.
4. Clicar em "Concluído".
5. **Esperado**: botão mostra spinner brevemente; ao concluir, o modal fecha e, ao reabrir, a lista
   reflete o novo papel (badge "Adm").

## Cenário 4a — Múltiplas alterações de papel em um único "Concluído"

1. Com o modal aberto, alterar o papel de dois membros diferentes (sem clicar em "Concluído" entre
   as seleções).
2. Clicar em "Concluído" uma única vez.
3. **Esperado**: ambas as alterações são salvas e o modal fecha somente depois que as duas forem
   confirmadas.

## Cenário 4b — Erro ao concluir mantém o modal aberto (FR-010a, FR-011)

1. Com as ferramentas de rede do navegador, simular falha (offline ou bloquear a chamada) na
   alteração de papel de um usuário.
2. Selecionar um novo papel para esse usuário e clicar em "Concluído".
3. **Esperado**: o modal permanece aberto; a mensagem de erro amigável aparece abaixo do nome/e-mail
   daquele usuário especificamente; a seleção pendente dele continua visível para nova tentativa.

## Cenário 5 — Restrições de alteração de papel (FR-008, FR-009)

1. Com o modal aberto, inspecionar a própria linha (usuário logado) e a linha do Dono.
2. **Esperado**: nenhum controle de alteração de papel aparece em nenhuma das duas linhas.
3. No controle de papel de outro membro, verificar as opções disponíveis.
4. **Esperado**: apenas Administrador, Membro e Visualizador aparecem como opções — "Dono" nunca é
   selecionável.

## Cenário 6 — Restrição de acesso (FR-012)

1. Logar como um usuário com papel Membro ou Visualizador do painel.
2. **Esperado**: o botão "Usuários" não aparece (regra já validada na spec 002); portanto nenhum
   controle de remover/alterar papel é alcançável por esse usuário.

## Cenário 7 — Falha de rede ao remover (FR-011)

1. Com as ferramentas de rede do navegador, simular falha (offline ou bloquear a chamada) e repetir
   o Cenário 1 (remoção).
2. **Esperado**: mensagem de erro amigável exibida no modal de confirmação; o membro continua na
   lista; os controles voltam a ficar disponíveis para nova tentativa.

## Cenário 8 — Modal de confirmação de remoção sempre à frente (FR-014, bug corrigido)

1. Com o modal "Usuários do painel" aberto, acionar o controle de remover em qualquer membro.
2. **Esperado**: o modal de confirmação de remoção aparece visualmente por cima do modal "Usuários
   do painel" (não atrás dele).

## Regressão a checar

- Os fluxos já existentes no mesmo modal — ver a lista completa (US1/US2) e adicionar usuário por
  e-mail (US1/US2 da spec 002) — continuam funcionando normalmente com os novos controles por
  linha.
- Os modais "Renomear painel" e "Excluir painel" (`painel-detalhe`) continuam funcionando
  normalmente.
- `ConviteService` e o fluxo de convite (issue #23) não são alterados por esta feature.
