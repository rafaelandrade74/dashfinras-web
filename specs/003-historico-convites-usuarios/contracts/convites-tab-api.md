# Contract: Endpoints consumidos pela aba "Convites enviados"

Nenhum endpoint novo. Reaproveita exatamente os dois já documentados/implementados na issue #23
(`specs/001-convite-usuario-email/contracts/convite-api.md`) — resumo aqui só para referência
rápida desta feature.

## GET /api/painel/{id}/convites

Já consumido por `ConviteService.listarConvites`. Retorna `ResponseConvitesDto { convites:
ResponseConviteDto[] }`.

- **Uso nesta feature**: chamado uma única vez por sessão do modal, na primeira vez que a aba
  "Convites enviados" é aberta (research.md, Decisão 2), e novamente após um reenvio bem-sucedido
  (FR-006).

## POST /api/painel/{id}/convites

Já consumido por `ConviteService.criarConvite`. Usado tanto pelo bloco "adicionar usuário" (issue
#22) quanto, agora, pelo botão "Reenviar" desta feature — mesma chamada, mesmo DTO.

- **Uso nesta feature**: ao clicar "Reenviar" em uma linha com status Recusado/Expirado/Invalidado,
  chamado com `{ email: convite.emailConvidado, permissao: convite.permissao, urlFrontend }` (os
  mesmos valores do convite original — FR-005), sem nenhum campo novo pedido ao usuário.

## Sem lógica de dedup/merge no frontend

Reafirmando a decisão já registrada na issue #23 (spec.md › Clarifications): a lista exibida é
exatamente o que `GET /api/painel/{id}/convites` retornar após o reenvio — se a API criar um novo
registro em vez de substituir o antigo, a lista mostra ambos; o frontend não decide isso.
