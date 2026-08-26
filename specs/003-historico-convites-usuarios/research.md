# Research: Histórico de convites no modal de usuários

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION`. Este documento registra
as decisões técnicas tomadas onde havia mais de uma abordagem razoável.

## Decisão 1 — Estilos de status precisam ser recriados (não existem mais no código)

**Decision**: Os estilos de badge de status (`.status-pendente`, `.status-aceito`, etc.) e a lista
de convites (`.invite-table`/equivalente) precisam ser **recriados do zero** em
`painel-detalhe.scss` — não existe nenhum resquício reaproveitável no código atual.

**Rationale**: Essa exata UI já foi implementada uma vez (issue #23, como aba separada na tela de
detalhe do painel) e depois **removida por completo** a pedido do usuário quando o design mudou
para "isso vai morar dentro do botão Usuários" (ver histórico de commits — `refactor(painel):
remove aba "Convites enviados" do detalhe do painel`). Uma busca no código confirma que não sobrou
nenhuma classe CSS nem enum de status referenciado em `painel-detalhe.*` hoje. `StatusConvite` (o
enum) continua existindo em `core/models/convite.model.ts` (issue #23), então o mapeamento de
label/cor por status é reescrito, mas o enum em si não.

**Alternatives considered**: Nenhuma — não há nada para reaproveitar; é implementação nova dentro
do modal, só usando o enum já existente.

## Decisão 2 — Carregamento sob demanda (lazy) da lista de convites

**Decision**: A lista de convites só é buscada (`ConviteService.listarConvites`) na primeira vez que
a aba "Convites enviados" é aberta dentro de uma sessão do modal, não junto com a abertura do modal
inteiro (que já dispara `PainelService.obterPainel` para popular a aba "Usuários"). Uma vez
carregada, a lista fica em um signal e não é recarregada automaticamente ao trocar de aba de novo
(só após um reenvio bem-sucedido — FR-006).

**Rationale**: Reduz uma chamada de API desnecessária para o caso comum de alguém que abre o modal
só para ver/adicionar usuários e nunca olha o histórico de convites (FR-003). Consistente com o
padrão já usado no restante do app de não pré-carregar dados que o usuário pode nunca pedir.

**Alternatives considered**:
- Carregar convites junto com o painel, sempre que o modal abre: rejeitado — chamada extra em toda
  abertura do modal, mesmo pra quem nunca troca de aba.
- Recarregar a lista toda vez que a aba é selecionada (mesmo sem ter mudado nada): rejeitado —
  chamadas repetidas sem necessidade; o reenvio já força um recarregamento explícito quando algo
  realmente muda.

## Decisão 3 — Estado de "reenviando" é por linha, não global

**Decision**: O estado de carregamento do reenvio (FR-007) é rastreado por `id` do convite
(`reenviandoConviteId: signal<string | undefined>`), não por um boolean global — permitindo que o
botão da linha específica mostre spinner/disabled sem travar o resto da lista.

**Rationale**: Evita que reenviar um convite trave visualmente a lista inteira; segue o mesmo padrão
já usado em `painel-detalhe.ts` antes de ser removido (implementação original da aba de convites,
issue #23) e em outros lugares do app onde uma ação em uma linha específica de uma lista precisa de
feedback local (ex.: nenhum padrão contraditório a resolver).

**Alternatives considered**: Um único `reenviando: signal<boolean>` global: rejeitado — impediria
reenviar duas linhas diferentes em sequência rápida sem necessidade real de serializar essas
chamadas (são requisições independentes).
