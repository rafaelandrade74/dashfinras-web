# Quickstart: Validar gerenciar usuários do painel

Guia para validar manualmente o fluxo depois de implementado. Pressupõe `api-dashfinras` e o BFF
deste repo rodando localmente (`npm run start:dev`), e um painel de teste com múltiplos usuários
(pode ser montado com o fluxo de convite da issue #23).

## Cenário 1 — Ver a lista de usuários (US1)

1. Logado como Dono de um painel com pelo menos 3 usuários (Dono + 2 outros papéis), abrir a tela
   de detalhe do painel.
2. Clicar em "Usuários".
3. **Esperado**: modal abre mostrando todos os usuários, cada um com avatar, nome, e-mail e papel;
   a linha do usuário logado (o Dono, neste caso) mostra uma indicação de "(você)".
4. Fechar o modal e logar como um usuário Membro ou Visualizador desse mesmo painel.
5. **Esperado**: o botão "Usuários" não aparece no cabeçalho da tela de detalhe.

## Cenário 2 — Adicionar usuário por e-mail já cadastrado (US2)

1. Logado como Dono ou Adm, abrir o modal "Usuários".
2. Informar o e-mail de uma conta já existente (não membro do painel) com papel "Membro".
3. Confirmar a adição.
4. **Esperado**: sem fechar o modal, a pessoa aparece na lista com papel Membro; nenhuma mensagem
   de erro.

## Cenário 3 — Adicionar usuário por e-mail sem conta (US2)

1. Repetir o Cenário 2 com um e-mail sem cadastro no app.
2. **Esperado**: o sistema confirma que um convite foi enviado; a pessoa **não** aparece na lista
   de membros atuais (só depois de aceitar o convite, via fluxo da issue #23).

## Cenário 4 — Validações client-side (US2)

1. No modal "Usuários", tentar adicionar o próprio e-mail (do usuário logado).
2. **Esperado**: bloqueado antes de qualquer chamada de rede, com mensagem clara.
3. Tentar adicionar o e-mail de alguém que já é membro do painel.
4. **Esperado**: bloqueado antes de qualquer chamada de rede, com mensagem clara.
5. Tentar adicionar um e-mail em formato inválido.
6. **Esperado**: bloqueado, com mensagem de validação.

## Cenário 5 — Ausência de ações de remover/alterar papel (FR-011, FR-012)

1. Com o modal "Usuários" aberto e uma lista com múltiplos papéis, inspecionar cada linha.
2. **Esperado**: nenhum botão de remover, nenhum select/dropdown de papel editável em nenhuma
   linha — inclusive na do Dono. O papel aparece só como texto/badge.

## Regressão a checar

- O fluxo de adicionar usuário na criação de um painel novo (issue #23, `painel-criar`) continua
  funcionando exatamente como antes — esta feature não deve alterar `ConviteService` nem seu
  contrato.
- Os modais "Renomear painel" e "Excluir painel" (já existentes em `painel-detalhe`) continuam
  funcionando normalmente com o novo modal "Usuários" adicionado ao mesmo componente.
