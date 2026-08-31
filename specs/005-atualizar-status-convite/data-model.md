# Data Model: Atualizar Status de Convite para Novo Formato da API

## Entidade: Convite (status)

Representação já existente (`ResponseConviteDto`), apenas com o campo `status` restrito a um novo
conjunto de valores.

| Campo | Tipo (novo) | Tipo (antigo) | Observação |
|---|---|---|---|
| `status` | `StatusConvite` = `'Pendente' \| 'Aprovado' \| 'Recusado' \| 'Expirado'` | `enum StatusConvite { PendenteCadastro=0, PendenteAprovacao=1, Concluido=2, Recusado=3, Expirado=4, Invalidado=5 }` | Vem da API já como um dos 4 valores textuais; sem conversão numérica. |

### Transições de estado (informativas, não aplicadas no frontend)

O frontend é somente leitura em relação ao status — apenas exibe o valor atual e decide se a ação
de reenvio aparece. As transições continuam de responsabilidade da API; o mapa abaixo documenta o
significado de cada estado para orientar rótulo e disponibilidade da ação:

| Status | Rótulo exibido | Classe visual | Reenvio disponível? |
|---|---|---|---|
| `Pendente` | "Pendente" | `status-pendente` | Não |
| `Aprovado` | "Aprovado" | `status-aceito` | Não |
| `Recusado` | "Recusado" | `status-recusado` | Sim |
| `Expirado` | "Expirado" | `status-expirado` | Sim |
| *(desconhecido/futuro)* | "Status desconhecido" | `status-desconhecido` | Não |

### Validação

- Nenhuma validação de entrada é feita pelo frontend sobre `status` — é um valor somente leitura
  vindo da API. A única "validação" é defensiva: se o valor não corresponder a nenhum dos 4
  conhecidos, cai no caso "desconhecido" (FR-006) em vez de lançar erro ou renderizar `undefined`.

### Relacionamentos

- `Convite.status` não referencia outras entidades; é usado isoladamente por `statusInfo()` (para
  exibição) e `podeReenviar()` (para controle de UI) em `painel-detalhe.ts`.
