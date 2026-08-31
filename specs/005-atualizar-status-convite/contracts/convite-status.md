# Contrato consumido: campo `status` de `ResponseConviteDto`

Este frontend não expõe uma API própria para este campo — ele é apenas consumidor do contrato já
publicado pela API (`api-dashfinras`). Este arquivo documenta o novo formato que o frontend passa a
esperar, para referência ao implementar e revisar.

## Endpoint afetado

`GET /api/paineis/{id}/convites` → `ResponseConvitesDto { convites: ResponseConviteDto[] }`

(consumido via `ConviteService.listarConvites`, `src/app/core/services/convite.service.ts`)

## Campo `status` (novo formato)

```csharp
public enum StatusConviteExibicao
{
    Pendente,
    Aprovado,
    Recusado,
    Expirado
}
```

**Correção pós-implementação (2026-08-27)**: a suposição original abaixo — de que a API serializa
o enum como string — estava **errada**. A API continua serializando `status` como número
(`JsonSerializer` padrão do .NET, sem `JsonStringEnumConverter`), só que agora com a ordem do novo
enum de 4 valores: `Pendente = 0`, `Aprovado = 1`, `Recusado = 2`, `Expirado = 3` (confirmado
inspecionando o payload real de `GET /api/paineis/{id}/convites` no DevTools). O frontend foi
ajustado para tratar `status` como o `enum StatusConvite` numérico de 4 valores nessa mesma ordem,
não como union de string.

## Formato anterior (removido)

```csharp
// Enum antigo — não mais retornado pela API a partir desta mudança
public enum StatusConvite
{
    PendenteCadastro = 0,
    PendenteAprovacao = 1,
    Concluido = 2,
    Recusado = 3,
    Expirado = 4,
    Invalidado = 5
}
```

## Mapeamento antigo → novo

| Valor antigo | Valor novo |
|---|---|
| `PendenteCadastro` | `Pendente` |
| `PendenteAprovacao` | `Pendente` |
| `Concluido` | `Aprovado` |
| `Recusado` | `Recusado` |
| `Expirado` | `Expirado` |
| `Invalidado` | *(sem equivalente — removido)* |

## Compatibilidade

Este frontend assume que a API já foi (ou será, de forma coordenada) atualizada para retornar
apenas os 4 valores novos — não há suporte planejado para receber os dois formatos
simultaneamente. Um valor fora dos 4 esperados é tratado defensivamente (ver FR-006 no
[spec.md](../spec.md)) mas não é um modo de operação suportado, apenas uma proteção contra quebra
de tela.
