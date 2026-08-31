# Quickstart: Validar histórico de convites no modal de usuários

Guia para validar manualmente depois de implementado. Pressupõe `api-dashfinras` e o BFF rodando
localmente (`npm run start:dev`) e um painel de teste com convites em status variados (pode ser
montado com o fluxo da issue #23/#22).

## Cenário 1 — Ver o histórico de convites (US1)

1. Logado como Dono de um painel com convites em pelo menos 2 status diferentes, abrir "Usuários"
   na tela de detalhe do painel.
2. Clicar na aba "Convites enviados".
3. **Esperado**: a lista mostra e-mail, papel, status e data de cada convite; a rede mostra uma
   chamada a `GET /api/painel/{id}/convites` (só nesse momento, não na abertura do modal).
4. Voltar para a aba "Usuários" e depois de novo para "Convites enviados".
5. **Esperado**: nenhuma nova chamada de rede na segunda vez que a aba é aberta (lista já em
   memória — research.md, Decisão 2).

## Cenário 2 — Reenviar convite (US2)

1. Na aba "Convites enviados", localizar um convite com status Expirado ou Recusado.
2. Clicar em "Reenviar".
3. **Esperado**: botão daquela linha mostra estado de carregamento; um novo
   `POST /api/painel/{id}/convites` é disparado com o mesmo e-mail/papel do convite original; ao
   concluir, a lista é recarregada via `GET /api/painel/{id}/convites`.
4. Verificar um convite com status Pendente ou Aceito.
5. **Esperado**: nenhum botão de reenviar aparece nessas linhas.

## Cenário 3 — Estado vazio e erro (US1)

1. Abrir a aba "Convites enviados" de um painel sem nenhum convite enviado.
2. **Esperado**: mensagem de estado vazio, sem erro.
3. Simular falha de rede (ex.: desligar a API momentaneamente) e reabrir a aba.
4. **Esperado**: mensagem de erro amigável só na aba de convites; a aba "Usuários" do mesmo modal
   continua funcionando normalmente.

## Regressão a checar

- A aba "Usuários" (issue #22) continua funcionando exatamente como antes — lista, adicionar por
  e-mail, indicação "(você)".
- O bloco de adicionar usuário por e-mail (issue #22) não foi alterado por esta feature.
