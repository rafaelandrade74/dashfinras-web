# Quickstart: validar nomes de tag para convidado de painel compartilhado

## Pré-requisitos

- `api-dashfinras` rodando localmente com a mudança de `GET /api/tag?idPainel=` implementada.
- `dashfinras-web` rodando via `npm run start:dev` (auth completo).
- Dois usuários de teste: dono do painel (A) e convidado aceito (B).

## Cenário

1. Logado como A, crie um painel, crie uma tag "Mercado" e associe a um lançamento.
2. Convide B para o painel (fluxo de convite existente) e aceite o convite como B.
3. Logado como B, abra a tela de movimentações do painel.
4. **Esperado**: o chip da tag mostra "Mercado", não um GUID.
5. Force uma falha em `GET /api/tag` (ex.: desligar a API momentaneamente) e recarregue a tela como
   B.
6. **Esperado**: o chip mostra o placeholder de fallback (ex.: "Tag indisponível"), nunca o GUID.

## Regressão

7. Logado como A (dono), confirme que a listagem de movimentações continua mostrando os nomes de
   tag corretamente (sem regressão do caso já funcional antes desta feature).
