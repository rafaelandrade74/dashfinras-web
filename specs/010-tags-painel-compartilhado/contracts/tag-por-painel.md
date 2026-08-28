# Contract: GET /api/tag?idPainel={id}

## Request

`GET /api/tag` — `idPainel` (query, opcional, `Guid`)

- Sem `idPainel`: comportamento atual inalterado (tags do usuário autenticado).
- Com `idPainel`: tags associadas a lançamentos desse painel (qualquer criador), desde que o
  usuário autenticado pertença ao painel.

## Response 200 — `ResponseTagsDto` (formato inalterado)

```json
{
  "tags": [
    { "id": "guid", "nome": "string", "criadoEm": "2026-08-01T00:00:00Z" }
  ]
}
```

## Response 403/404 (a confirmar código exato conforme padrão já usado em endpoints de painel)

Quando `idPainel` é informado e o usuário não pertence a esse painel.

## Contrato de erro (`Erro[]`)

Mesmo formato já usado nos demais endpoints (`{ codigo, descricao }`).
