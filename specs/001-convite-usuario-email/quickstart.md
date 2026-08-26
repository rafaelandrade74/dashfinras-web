# Quickstart: Validar convite de usuário por e-mail

Guia para validar manualmente o fluxo ponta a ponta depois de implementado. Pressupõe as duas APIs
rodando localmente (`api-dashfinras` e o BFF deste repo) e dois usuários de teste distintos (A =
dono do painel, B = convidado).

## Pré-requisitos

- `api-dashfinras` rodando localmente com os endpoints de `v1.json` disponíveis (ver
  `contracts/convite-api.md`).
- Neste repo: `.env` e `src/environments/environment*.ts` preenchidos (ver `CLAUDE.md`).
- `npm run start:dev` (UI + BFF juntos — necessário porque o fluxo depende de `/api/auth/*`).
- Dois usuários de teste já cadastrados via fluxo normal de cadastro do app (A e B), com e-mails
  conhecidos, **ou** um segundo e-mail de teste sem conta nenhuma para validar o caminho de convite
  "sem conta existente".

## Cenário 1 — Convidar usuário existente ao criar o painel (US1)

1. Logar como usuário A.
2. Ir em "Novo painel", preencher o nome, abrir "Usuários (opcional)".
3. Adicionar o e-mail do usuário B com papel "Membro" → confirmar que aparece na lista de pendentes.
4. Clicar em "Criar painel".
5. **Esperado**: painel criado, redirecionado para `/paineis`; nos logs de rede,
   `POST /api/painel/{id}/convites` disparado para o e-mail de B logo após `POST /api/painel`.
6. Logar como usuário B → verificar que o painel já aparece na lista de painéis de B, com papel
   Membro (associação direta, sem passar pela tela de convite).

## Cenário 2 — Convidar e-mail sem conta (US1 → US2 → US3)

1. Repetir os passos 1-4 do Cenário 1, mas com um e-mail sem cadastro no app.
2. **Esperado**: painel criado normalmente; `POST /api/painel/{id}/convites` disparado para o
   e-mail novo.
3. Consultar o convite gerado via `GET /api/painel/{id}/convites` (como A, na aba "Convites
   enviados") ou via `GET /api/convites/{token}` com o token retornado no passo 2 — copiar o link
   completo (`urlFrontend` + `?token=...`).
4. Abrir o link em uma aba anônima (sem sessão).
5. **Esperado**: tela pública mostra painel, papel oferecido — e "quem convidou" se o campo existir
   na API (ver Nota em `data-model.md`).
6. Clicar em "Aceitar convite" sem estar logado.
7. **Esperado**: redireciona para `/login?redirectUrl=/convites/:token`; completar cadastro/login
   com um novo usuário usando esse e-mail; ao concluir, retorna à tela de convite.
8. Clicar em "Aceitar convite" novamente, já autenticado.
9. **Esperado**: tela de confirmação "Convite aceito" com link para o painel; o novo usuário agora
   aparece na lista de usuários do painel com o papel Membro.

## Cenário 3 — Recusar convite (US2 → US3)

1. Gerar um novo convite (Cenário 1 ou 2) para um terceiro e-mail de teste.
2. Abrir o link de convite autenticado como o destinatário.
3. Clicar em "Recusar".
4. **Esperado**: tela de confirmação "Convite recusado"; o e-mail não é associado ao painel.

## Cenário 4 — Convite expirado / inválido (US2)

1. Usar um token de convite conhecido como expirado (ou aguardar a expiração configurada no
   backend) e abrir `/convites/:token`.
2. **Esperado**: tela informa "Convite expirado", sem botões Aceitar/Recusar.
3. Abrir `/convites/token-inexistente-123`.
4. **Esperado**: tela informa erro de convite inválido/inexistente, sem crash da aplicação.

## Cenário 5 — Aba "Convites enviados" (US4)

1. Logado como A (dono), abrir o painel usado nos cenários anteriores → aba "Convites enviados".
2. **Esperado**: lista mostra os convites dos Cenários 1-4 com e-mail, papel, status
   (Aceito/Recusado/Pendente/Expirado) e data de envio corretos.
3. Em um convite Recusado ou Expirado, acionar "Reenviar".
4. **Esperado**: novo `POST /api/painel/{id}/convites` disparado para o mesmo e-mail/papel; a lista
   atualiza para refletir o novo convite.
5. Logar como um usuário sem ser dono desse painel e abrir a mesma tela de detalhe.
6. **Esperado**: a aba "Convites enviados" não aparece (FR-017).

## Cenário 6 — Estado vazio (US4)

1. Criar um painel novo sem adicionar nenhum e-mail.
2. Abrir a aba "Convites enviados" desse painel.
3. **Esperado**: mensagem de estado vazio, sem erro.

## Regressão a checar

- Criar painel **sem** nenhum e-mail na lista continua funcionando exatamente como antes desta
  feature (FR-007) — não deve haver chamada a `/convites` quando a lista está vazia.
- Tentar adicionar o próprio e-mail (do usuário logado) à lista de pendentes é bloqueado (FR-004).
- Tentar adicionar um e-mail já presente na lista é bloqueado (FR-003).
