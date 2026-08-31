# Research: Atualizar Status de Convite para Novo Formato da API

## Decisão 1: Serialização do status — string ou número

**Decision**: Tratar `status` como string com os valores exatos do enum (`"Pendente"`,
`"Aprovado"`, `"Recusado"`, `"Expirado"`), não como número.

**Rationale**: O enum novo se chama `StatusConviteExibicao` — o sufixo "Exibição" (exibir/exibição
= *display*) indica que a API já serializa esse valor especificamente para consumo de UI, o que é
o padrão comum de expor enums como string (`JsonStringEnumConverter`) quando o valor se destina à
apresentação direta ao usuário. A documentação de contrato já existente em
`specs/001-convite-usuario-email/contracts/convite-api.md` também referencia os valores de status
pelo nome (`PendenteCadastro`, `Concluido`, etc.), reforçando que o formato observável no payload
já é textual.

**Alternatives considered**:
- Manter `status` como número (`0..3`) e mapear por índice — rejeitado: exigiria a API publicar e
  manter estável a ordem numérica do enum, é mais frágil a reordenações futuras, e conflita com o
  indício de nome ("Exibição") de que o valor já vem pronto para exibição.

## Decisão 2: Modelagem do tipo `StatusConvite` no frontend

**Decision**: Substituir o `enum StatusConvite` numérico atual (`convite.model.ts`) por um union
type de string literal (`type StatusConvite = 'Pendente' | 'Aprovado' | 'Recusado' | 'Expirado'`),
mantendo o nome do símbolo exportado (`StatusConvite`) para minimizar o diff nos importadores.

**Rationale**: Um union de string literal reflete diretamente os valores que trafegam no JSON sem
exigir conversão numérico↔string, e o TypeScript já dá exhaustiveness checking em `switch`/records
indexados por union type, igual ao que hoje se obtém com enum. É consistente com o padrão de
"strings em português" já em uso nos rótulos exibidos (`CLAUDE.md`).

**Alternatives considered**:
- Manter como TypeScript `enum` de string (`enum StatusConvite { Pendente = 'Pendente', ... }`) —
  também válido e mais próximo do padrão anterior; funciona igualmente bem com `Record<StatusConvite, ...>`.
  Não foi descartado por ser pior, mas o union type é preferido por ser mais simples (não gera
  código JS extra em runtime) e por não haver, no restante do projeto, um padrão dominante de usar
  enum vs. union para valores vindos de API — este será o critério mínimo (YAGNI) para esta mudança
  pontual.

## Decisão 3: Tratamento de status desconhecido (FR-006)

**Decision**: `statusInfo()` usa um fallback (`STATUS_INFO[status] ?? STATUS_DESCONHECIDO`) que
retorna um rótulo neutro (ex.: "Status desconhecido") com uma classe CSS neutra, em vez de deixar
`STATUS_INFO[status]` retornar `undefined` (o que quebraria o binding no template ao acessar
`.label`/`.classe` de `undefined`).

**Rationale**: Atende diretamente ao FR-006 e ao Edge Case documentado no spec — protege a
listagem inteira de travar por causa de uma única linha com valor inesperado (ex.: cache
desatualizado durante o deploy da API, ou um valor futuro ainda não mapeado).

**Alternatives considered**:
- Filtrar/ocultar convites com status desconhecido da lista — rejeitado: esconde informação do
  usuário (o convite existe e algo mudou) sem necessidade; um rótulo neutro visível é mais
  transparente e mais simples de implementar.

## Decisão 4: Ação "reenviar convite" (`podeReenviar`)

**Decision**: `podeReenviar(status)` passa a checar apenas `status === 'Recusado' || status === 'Expirado'`,
removendo a checagem de `Invalidado` (estado que deixa de existir).

**Rationale**: Requisito explícito FR-004/FR-005 do spec; é a mesma lógica já existente, apenas com
um dos três valores antigos removido — não há ambiguidade a resolver.

**Alternatives considered**: N/A — comportamento definido diretamente pelo spec.
