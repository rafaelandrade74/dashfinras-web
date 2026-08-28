# Feature Specification: Nomes de tags para usuários convidados em painel compartilhado

**Feature Branch**: `[010-tags-painel-compartilhado]`

**Created**: 2026-08-28

**Status**: Draft — histórias prontas para iniciar, implementação NÃO iniciada

**Input**: Issue [#41](https://github.com/rafaelandrade74/dashfinras-web/issues/41) — quando o dono de um
painel o compartilha (fluxo de convite), o usuário convidado, ao consultar as movimentações do
painel, vê o GUID da tag em vez do nome nos chips de tag da listagem.

## Contexto

`painel-detalhe.ts` resolve nome de tag localmente via um `Map` (`nomeTagPorId`) populado por
`TagService.listar()` (`GET /api/tag`). Esse endpoint aparenta ser escopado ao usuário autenticado
(tags que ele mesmo criou), não ao painel. Um convidado que não é dono das tags usadas nos
lançamentos não tem essas tags no seu próprio `GET /api/tag`, então o `Map` não resolve o id e o
fallback em `tagsLancamento()` expõe o GUID cru:

```ts
tagsLancamento(l: ResponseMovimentacaoDto): string[] {
  const mapa = this.nomeTagPorId();
  return (l.idsTags ?? []).map((id) => mapa.get(id) ?? id);
}
```

A causa raiz exata (escopo do endpoint no `api-dashfinras`, modelo de dados de tag por
usuário vs. por painel) precisa ser confirmada na fase de `/plan` antes de implementar — este
documento organiza as histórias de usuário para que a investigação e a correção possam começar
de forma independente e priorizada, sem travar em uma única entrega grande.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Convidado vê o nome da tag, não o GUID, ao consultar movimentações (Priority: P1)

Como usuário convidado para um painel que não é meu, quero ver o nome de cada tag nos lançamentos
da tela de movimentações, para entender a categorização dada pelo dono do painel sem precisar
decifrar um GUID.

**Why this priority**: É o próprio bug relatado — sem isso, a tela de movimentações é
confusa/ilegível para qualquer membro convidado que não seja o dono.

**Independent Test**: Com um painel de teste, o dono cria uma tag e a associa a um lançamento;
um usuário convidado (papel de membro, não dono) acessa `painel-detalhe` desse painel e verifica
que o chip da tag mostra o nome, não o GUID.

**Acceptance Scenarios**:

1. **Given** um painel compartilhado com um convidado, **When** o dono cria uma tag e a associa a
   um lançamento, **Then** o convidado, ao abrir a listagem de movimentações do painel, vê o nome
   da tag no chip, não o id.
2. **Given** uma tag criada pelo próprio convidado nesse painel, **When** ele visualiza a
   listagem, **Then** o nome continua exibido corretamente (sem regressão do caso já funcional).
3. **Given** uma tag que foi excluída após a associação ao lançamento (se exclusão de tag existir
   no sistema), **When** o convidado (ou o dono) visualiza o lançamento, **Then** o sistema exibe
   um fallback legível (não o GUID cru) — comportamento exato a definir em `/clarify` ou `/plan`.

---

### User Story 2 - Endpoint de tags retorna as tags do painel, não apenas as do usuário logado (Priority: P1)

Como API consumida pelo frontend, quero que a consulta de tags relevantes a um painel retorne
todas as tags usadas nesse painel (ou pelo menos as necessárias para resolver os lançamentos
exibidos), independentemente de qual membro do painel as criou.

**Why this priority**: É a correção estrutural que resolve a User Story 1 na raiz; sem mudar o
escopo do endpoint (ou como o frontend o consulta), qualquer solução vira um workaround pontual na
UI.

**Independent Test**: Chamar o endpoint (ou a nova variante escopada por painel) autenticado como
um convidado e confirmar que a resposta inclui tags criadas por outros membros/pelo dono do mesmo
painel.

**Acceptance Scenarios**:

1. **Given** um painel com tags criadas por múltiplos membros (dono e convidados), **When** um
   convidado consulta as tags desse painel, **Then** a resposta inclui todas as tags do painel,
   não somente as criadas por ele.
2. **Given** um usuário que não é membro do painel, **When** ele tenta consultar as tags desse
   painel (por id de painel), **Then** o acesso é negado (não deve vazar tags de painéis aos quais
   o usuário não pertence).

---

### User Story 3 - Fallback visual não expõe GUID quando uma tag não pode ser resolvida (Priority: P2)

Como qualquer usuário do painel, quero que, se por algum motivo uma tag não puder ser resolvida
para nome (erro de rede, tag órfã, condição de corrida no carregamento), o chip mostre algo
compreensível (ex.: um rótulo genérico ou estado de carregamento) em vez de um GUID.

**Why this priority**: Rede de segurança independente da causa raiz do bug principal — mesmo após
a User Story 2, falhas transitórias (erro no `carregarTags()`, que hoje é silenciosamente
ignorado) continuam deixando o `Map` incompleto.

**Independent Test**: Forçar `TagService.listar()` a falhar (ex.: mock retornando erro) e verificar
que `tagsLancamento()` não expõe o GUID cru no template.

**Acceptance Scenarios**:

1. **Given** uma falha ao carregar a lista de tags, **When** a listagem de movimentações é
   renderizada, **Then** os chips de tag não exibem GUID — exibem um placeholder definido (a
   definir o texto exato em `/plan`, ex. "tag indisponível") e o restante da tela funciona
   normalmente.
2. **Given** a lista de tags carregada com sucesso, **When** um `idsTags` do lançamento não consta
   no mapa (tag removida do sistema após a associação, por exemplo), **Then** o mesmo placeholder
   é exibido em vez do GUID.

---

### Edge Cases

- Um lançamento pode ter tags associadas por mais de um membro do painel ao longo do tempo — a
  resolução de nome não pode assumir que todas as tags pertencem ao usuário atualmente logado.
- Painéis muito antigos podem ter `idsTags` apontando para tags já excluídas — ver User Story 3.
- Carregamento assíncrono: `carregarTags()` e `carregarLancamentos()` disparam em paralelo: nos
  primeiros instantes da tela, `nomeTagPorId` pode estar vazio mesmo para tags resolvíveis — isso
  já é coberto pelo mesmo fallback da User Story 3 e não deve ser tratado como bug à parte.
- Convidado com papel restrito (se o painel tiver papéis diferenciados, ver
  `007-remover-alterar-papel-painel`) — confirmar em `/plan` se todos os papéis devem enxergar
  todas as tags do painel ou se há alguma tag "privada" por membro (assumido que não existe hoje).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que qualquer membro de um painel (dono ou convidado
  aceito) resolva o nome de qualquer tag associada a um lançamento desse painel, independente de
  quem criou a tag.
- **FR-002**: O sistema NÃO DEVE expor o identificador interno (GUID) da tag como texto visível
  na UI em nenhum cenário normal de uso.
- **FR-003**: O endpoint (ou consulta) usado para resolver tags de um painel DEVE respeitar o
  controle de acesso existente por painel — usuários que não são membros não podem listar as tags
  desse painel.
- **FR-004**: Quando a resolução de nome de uma tag falhar (erro de rede) ou não encontrar
  correspondência (tag ausente/excluída), o sistema DEVE exibir um fallback legível definido, nunca
  o id cru.

### Key Entities *(include if feature involves data)*

- **Tag**: `{ id, nome, criadoEm }` — hoje aparentemente associada a um usuário criador; precisa
  ganhar (ou já ter, a confirmar) uma associação de painel para viabilizar FR-001/FR-003.
- **Movimentação Financeira**: referencia tags via `idsTags: string[]`, resolvidos para nome
  somente no cliente hoje.
- **Painel / Membro do Painel**: relação existente (convite/`ConviteModule`) que já define quem
  pode acessar um painel — reaproveitada para o novo controle de acesso de tags por painel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos convidados de um painel veem o nome (não o GUID) de qualquer tag associada
  a um lançamento visível para eles, em teste manual e em teste automatizado de regressão.
- **SC-002**: Nenhum GUID de tag aparece na UI da tela de movimentações em nenhum caminho de erro
  testado (falha de rede, tag órfã).
- **SC-003**: A listagem de movimentações de um painel compartilhado carrega sem aumento
  perceptível de latência em relação ao comportamento atual (mesma ordem de grandeza de chamadas
  à API).

## Assumptions

- O modelo de convite/membro de painel já existente (`ConviteModule`,
  `007-remover-alterar-papel-painel`) é a fonte de verdade de quem pode ver as tags de um painel —
  não é necessário um novo mecanismo de permissão.
- Não existe hoje o conceito de "tag privada" visível só para quem a criou; assume-se que todas as
  tags associadas a lançamentos de um painel devem ser visíveis a todos os membros desse painel.
  Se essa suposição estiver errada, ela deve ser revisitada em `/clarify` antes do `/plan`.
- A causa raiz é o escopo do endpoint `GET /api/tag` (por usuário, não por painel) no
  `api-dashfinras` — a confirmar/investigar formalmente na fase de `/plan`, que deve decidir entre
  (a) mudar o escopo desse endpoint, (b) criar um endpoint novo escopado por painel, ou (c) incluir
  o nome da tag diretamente no DTO de movimentação retornado pela API.
