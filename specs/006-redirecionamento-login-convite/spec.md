# Feature Specification: Redirecionamento de login/cadastro ao responder convite

**Feature Branch**: `006-redirecionamento-login-convite`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "implementar o endpoint que recebe o token do convite para aprovar ou recusar o acesso a um painel, lembrando que se ele não está conectado ou não tem conta precisa fazer login e redirecionar para essa pagina, mas se ele não tiver cadastro completa primeiro o cadastro dele e redireciona para os convites"

## Clarifications

### Session 2026-08-26

- Q: Quando alguém sem sessão ativa abre um link de convite que já está inválido/expirado, o sistema deve exigir login antes de mostrar essa mensagem de erro, ou validar o token e mostrar o erro mesmo sem login? → A: Sempre autenticar primeiro — o sistema sempre redireciona para login antes de qualquer consulta ao convite; a mensagem de erro (token inválido/expirado, já decidido, etc.) só aparece depois do login (e do cadastro completo, se necessário).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Decidir convite sem estar autenticado (Priority: P1)

Uma pessoa recebe o link de um convite (`/convites/:token`) e abre esse link sem estar logada no
DashFinRas. Em vez de ver um erro ou uma tela vazia, ela é levada a fazer login (ou se cadastrar,
caso ainda não tenha conta) e, assim que concluir, volta automaticamente para a tela do convite,
já podendo aprovar ou recusar o acesso ao painel oferecido.

**Why this priority**: É o caso mais comum na prática — a pessoa convidada normalmente clica no
link do e-mail sem ter uma sessão ativa no navegador. Sem esse redirecionamento, o convite nunca
chega a ser decidido e o fluxo de convite (já existente) fica incompleto nesse ponto de entrada.

**Independent Test**: Abrir o link de um convite pendente em uma janela sem sessão ativa, fazer
login com uma conta já cadastrada e confirmar que a pessoa retorna à tela daquele convite
específico (mesmo token), podendo aprovar ou recusar.

**Acceptance Scenarios**:

1. **Given** um link de convite válido e pendente, **When** uma pessoa sem sessão ativa abre o
   link, **Then** ela é redirecionada para a tela de login, preservando a referência ao convite.
2. **Given** a pessoa foi redirecionada ao login a partir de um convite, **When** ela conclui o
   login com uma conta já existente e com cadastro completo, **Then** ela retorna diretamente para
   a tela do mesmo convite (mesmo token), com as ações de aprovar/recusar disponíveis.
3. **Given** a pessoa foi redirecionada ao login a partir de um convite, **When** ela opta por
   criar uma conta nova em vez de entrar em uma existente, **Then** ao concluir a criação da conta
   ela segue para completar o cadastro (User Story 2) em vez de ir direto ao convite.

---

### User Story 2 - Completar cadastro antes de decidir o convite (Priority: P1)

Uma pessoa já autenticada (login feito ou conta recém-criada), mas que ainda não completou o
cadastro de usuário da aplicação, abre o link de um convite. Antes de conseguir aprovar ou recusar
o convite, ela é levada a completar seu cadastro; só depois disso é levada de volta ao convite.

**Why this priority**: O acesso ao painel depende de existir um usuário de aplicação totalmente
cadastrado (mesma regra já aplicada pelo `accountGuard` no restante do app); sem essa etapa, a
aprovação do convite ficaria associada a uma conta incompleta, quebrando pressupostos do restante
do sistema.

**Independent Test**: Com uma conta Supabase autenticada mas sem cadastro de usuário completo,
abrir o link de um convite pendente, completar o formulário de cadastro e confirmar que a pessoa é
levada de volta à tela daquele mesmo convite, podendo então aprovar ou recusar.

**Acceptance Scenarios**:

1. **Given** uma pessoa autenticada sem cadastro completo, **When** ela abre o link de um convite
   pendente, **Then** ela é redirecionada para a tela de completar cadastro, preservando a
   referência ao convite.
2. **Given** a pessoa foi redirecionada para completar cadastro a partir de um convite, **When**
   ela conclui o cadastro com sucesso, **Then** ela é levada de volta para a tela do mesmo convite
   (mesmo token), com as ações de aprovar/recusar disponíveis.
3. **Given** a pessoa foi redirecionada para completar cadastro a partir de um convite, **When**
   ela abandona o formulário sem concluir e depois abre o link do convite novamente, **Then** ela é
   redirecionada para completar cadastro novamente, sem conseguir decidir o convite antes disso.

---

### User Story 3 - Aprovar ou recusar o convite já autenticado e cadastrado (Priority: P1)

Uma pessoa autenticada e com cadastro completo abre o link do convite e consegue aprovar ou
recusar o acesso ao painel diretamente, sem qualquer redirecionamento intermediário.

**Why this priority**: É o caminho feliz do fluxo de decisão do convite e a ação final que todos os
redirecionamentos das outras User Stories existem para viabilizar; sem ela, aprovar/recusar não
tem efeito nenhum.

**Independent Test**: Com uma conta autenticada e cadastro completo, abrir o link de um convite
pendente destinado ao e-mail dessa conta e confirmar que aprovar/recusar atualiza o status do
convite e concede (ou não) acesso ao painel, sem passar por login ou cadastro.

**Acceptance Scenarios**:

1. **Given** uma pessoa autenticada e com cadastro completo, **When** ela abre o link de um
   convite pendente endereçado a ela, **Then** a tela do convite é exibida imediatamente com as
   ações de aprovar/recusar, sem redirecionamento.
2. **Given** a tela do convite exibida, **When** a pessoa clica em "Aprovar", **Then** o acesso ao
   painel é concedido e o status do convite passa a refletir a aprovação.
3. **Given** a tela do convite exibida, **When** a pessoa clica em "Recusar", **Then** o acesso ao
   painel não é concedido e o status do convite passa a refletir a recusa.

---

### Edge Cases

- O que acontece se o link do convite já estiver inválido, expirado ou já decidido, e a pessoa
  ainda não tiver sessão ativa? O sistema redireciona para login (e cadastro, se necessário) da
  mesma forma que faria para um convite válido; a mensagem correspondente ao estado real do
  convite só é exibida depois que a pessoa concluir login/cadastro, pois a consulta ao convite
  depende de uma sessão autenticada.
- O que acontece se, após o redirecionamento por login ou cadastro, o convite já tiver sido
  decidido por outra sessão/dispositivo (ex.: expirado ou já aprovado/recusado) enquanto a pessoa
  completava login/cadastro? A tela do convite deve mostrar o estado atual real do convite, não uma
  ação de decisão indisponível para o estado retornado.
- O que acontece se a pessoa fizer login com uma conta cujo e-mail é diferente do e-mail para o
  qual o convite foi endereçado? A tela do convite deve ser exibida normalmente pelo token, e a
  decisão de aprovar/recusar depende apenas do que a API retornar para aquele token (esta
  especificação não define regra adicional de correspondência de e-mail, que é responsabilidade da
  API).
- O que acontece se a pessoa abrir o link do convite, for redirecionada ao login, mas fechar a
  aba antes de concluir? Nenhuma decisão é tomada; o convite permanece no estado anterior até que o
  link seja aberto novamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao abrir a tela de convite (`/convites/:token`) sem sessão ativa, o sistema DEVE
  redirecionar a pessoa para a tela de login, preservando a referência ao convite (token) para uso
  após a autenticação, independentemente de o convite ser válido, inválido, expirado ou já
  decidido — a validade do convite só é checada depois que a pessoa está autenticada.
- **FR-002**: Após concluir o login a partir de um redirecionamento originado por um convite, o
  sistema DEVE levar a pessoa de volta à tela daquele mesmo convite (mesmo token) quando o cadastro
  de usuário já estiver completo.
- **FR-003**: Ao abrir a tela de convite estando autenticado mas sem cadastro de usuário completo,
  o sistema DEVE redirecionar a pessoa para a tela de completar cadastro, preservando a referência
  ao convite.
- **FR-004**: Após concluir o cadastro de usuário a partir de um redirecionamento originado por um
  convite, o sistema DEVE levar a pessoa de volta à tela daquele mesmo convite (mesmo token).
- **FR-005**: Ao abrir a tela de convite estando autenticado e com cadastro completo, o sistema
  DEVE exibir imediatamente a tela de decisão do convite (aprovar/recusar), sem redirecionamento.
- **FR-006**: O sistema DEVE permitir que uma pessoa autenticada e com cadastro completo aprove ou
  recuse um convite pendente identificado pelo seu token.
- **FR-007**: O sistema DEVE refletir na tela do convite o resultado da ação de aprovar ou recusar
  (sucesso, ou erro caso a ação falhe ou o convite já não esteja mais decidível).
- **FR-008**: O sistema DEVE preservar a referência ao convite através de toda a sequência
  login → cadastro → convite quando ambas as etapas forem necessárias, sem exigir que a pessoa
  reabra o link do e-mail entre as etapas.

### Key Entities

- **Convite**: Convite de acesso a um painel identificado por um token; usado para decidir se a
  pessoa que abre o link já pode ver a tela de decisão ou precisa antes passar por login e/ou
  cadastro.
- **Sessão do usuário**: Estado de autenticação da pessoa que abre o link do convite; determina se
  o redirecionamento para login é necessário.
- **Cadastro de usuário**: Perfil de aplicação vinculado à sessão autenticada; determina se o
  redirecionamento para completar cadastro é necessário antes de decidir o convite.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos acessos ao link de um convite sem sessão ativa resultam em retorno à tela
  daquele mesmo convite assim que o login é concluído, sem a pessoa precisar reabrir o e-mail.
- **SC-002**: 100% dos acessos ao link de um convite por pessoa autenticada sem cadastro completo
  resultam em retorno à tela daquele mesmo convite assim que o cadastro é concluído.
- **SC-003**: Pessoas já autenticadas e com cadastro completo conseguem aprovar ou recusar um
  convite em uma única tela, sem nenhum redirecionamento intermediário.
- **SC-004**: 0% dos redirecionamentos de login/cadastro originados por um convite terminam em uma
  tela genérica (ex.: painel padrão) em vez de retornar ao convite de origem.

## Assumptions

- A tela pública de convite (`/convites/:token`) e as ações de aprovar/recusar já existem no
  frontend (entregues na feature de convite por e-mail); este trabalho cobre especificamente o
  comportamento de redirecionamento quando a pessoa não está autenticada ou não tem cadastro
  completo, reaproveitando o mesmo padrão de `redirectUrl` já usado por `authGuard`/`accountGuard`
  no restante do app.
- "Aprovar" e "recusar" o convite correspondem às ações já existentes de aceitar/recusar descritas
  na especificação da feature de convite por e-mail; não há uma terceira decisão possível.
- O endpoint de backend que aplica a aprovação/recusa do convite a partir do token já existe ou é
  fornecido pela API (`api-dashfinras`); este trabalho cobre o comportamento do frontend ao redor
  desse endpoint (quando chamá-lo e como redirecionar antes disso), não a criação do contrato de
  API em si.
- Após aprovar ou recusar um convite, a pessoa permanece na tela de confirmação do próprio convite
  (já coberta pela feature de convite por e-mail) e não é redirecionada automaticamente para o
  painel.
