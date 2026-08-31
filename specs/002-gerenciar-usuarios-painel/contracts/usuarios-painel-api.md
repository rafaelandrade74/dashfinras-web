# Contract: Endpoints consumidos por "Gerenciar usuários do painel"

Nenhum endpoint novo. Esta feature consome exclusivamente endpoints já existentes e já usados por
outras telas — confirmados contra o código-fonte real da `api-dashfinras` (não apenas `v1.json`).

## GET /api/painel/{id}

Já consumido por `PainelService.obterPainel` (issue #19), sem alteração. Fonte da lista de usuários
exibida (`ResponsePainelDto.usuarios`).

- **Uso nesta feature**: recarregado após uma adição bem-sucedida por conta já existente, pra
  garantir que a lista reflita exatamente o que a API persistiu (research.md, Decisão 2).

## POST /api/painel/{id}/convites

Já consumido por `ConviteService.criarConvite` (issue #23), sem alteração de contrato.

- **Uso nesta feature**: chamado pelo bloco "adicionar usuário" do modal, com o mesmo
  `RequestCriarConviteDto { email, permissao, urlFrontend }` já usado em `painel-criar.ts`.

## Confirmação: `PUT /api/painel/{id}/adicionar-usuario` NÃO é usado nesta feature

`RequestAddUsuarioPainelDto { id, permissao }` existe no contrato da API, mas **não é chamado por
esta feature** — investigação do código-fonte real (`PainelRepository.AddUsuarioPainel`) confirmou
que esse endpoint é estritamente de inserção por `id` de usuário já conhecido, e silenciosamente
ignora ids que já são membros do painel (sem erro, sem update de papel). Como esta feature só
adiciona por e-mail (endpoint de convite, que resolve o id internamente na API) e não oferece
alterar papel de membro existente, esse endpoint não tem uso aqui. Documentado para não ser
reintroduzido por engano — ver `spec.md` › Assumptions e `research.md`.

## Endpoints necessários mas inexistentes (fora de escopo)

Não usados porque não existem, não porque foram esquecidos:

- Remover usuário do painel (`DELETE /api/painel/{id}/usuario/{userId}` ou equivalente) — não
  existe na API hoje.
- Atualizar papel de um membro já existente — não existe endpoint dedicado; `PUT
  .../adicionar-usuario` não serve pra isso (ver acima).

Se esses endpoints forem criados no backend no futuro, a issue #22 original (remover/alterar papel)
pode ser reaberta como uma entrega separada, reaproveitando o mesmo modal.
