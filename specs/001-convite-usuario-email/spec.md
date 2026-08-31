# Feature Specification: Convite de usuário por e-mail

**Feature Branch**: `feature/23-convite-usuario-email`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "Issue #23 do dashfinras-web: Adicionar usuários ao painel por e-mail (convite). Escopo aprovado (design em https://claude.ai/code/artifact/a3366b4b-afe2-4b3b-b52a-a0baafc67b97): 1) Seção 'Usuários (opcional)' no modal de criação de painel — usuário informa e-mail + papel e adiciona à lista antes de criar o painel; se o e-mail corresponde a uma conta existente, o backend associa direto, senão dispara convite por e-mail. Sem código de convite manual, só e-mail. 2) Página pública de convite recebido (/convites/:token) com Aceitar/Recusar, tratando convite expirado. 3) Estados finais de decisão do convite: aceito (com link para o painel) e recusado. 4) Aba 'Convites enviados' na tela de detalhe do painel (só dono): lista convites com status, data, e-mail e papel; permite reenviar convite expirado/recusado. Backend já expõe os endpoints de convite; este trabalho é consumir esses endpoints no frontend Angular."

## Clarifications

### Session 2026-08-25

- Q: Quando o e-mail informado já pertence a uma conta que já é membro daquele painel, o que o sistema deve fazer? → A: Permitir adicionar normalmente; o backend decide o que fazer (comportamento não especificado nesta entrega)
- Q: Quando o dono aciona "Reenviar" em um convite Recusado ou Expirado, o convite antigo deve continuar aparecendo na lista como registro separado, ou ser substituído? → A: O frontend não decide isso — a aba "Convites enviados" sempre exibe exatamente a lista retornada por `GET /api/painel/{id}/convites`, seja ela uma linha única por e-mail ou um histórico completo; nenhuma lógica de deduplicação/merge é feita no cliente
- Q: A tela pública de convite deve exibir "quem convidou" quando o schema documentado de `ResponseConviteDto` não lista esse campo? → A: Sim — o backend resolve quem convidou a partir do próprio convite/token (o convite já sabe quem o criou), então a informação é considerada disponível pela API; a implementação MUST confirmar o campo exato retornado (pode não estar refletido no `v1.json` consultado) em vez de remover o requisito da tela

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Convidar usuário por e-mail ao criar um painel (Priority: P1)

Ao criar um novo painel, o dono quer opcionalmente adicionar outras pessoas informando apenas o e-mail delas e o papel que terão (Adm, Membro ou Visualizador), sem precisar saber se essa pessoa já tem conta no DashFinRas.

**Why this priority**: É o ponto de entrada principal do fluxo e o motivo da issue — hoje não existe nenhuma forma de adicionar outra pessoa a um painel sem saber o ID dela. Sem isso, nenhum dos outros fluxos (aceitar, recusar, listar convites) tem como ser exercitado.

**Independent Test**: Criar um painel novo, adicionar um e-mail com papel "Membro" à lista antes de salvar, confirmar a criação e verificar que o painel foi criado; entrega valor mesmo que as demais telas (aceitar/recusar/listar convites) ainda não existam, pois o convite já é dispachado pelo backend.

**Acceptance Scenarios**:

1. **Given** o modal "Novo painel" aberto, **When** o usuário informa um e-mail válido, escolhe um papel e clica em adicionar, **Then** o e-mail aparece na lista de pendentes do modal com o papel escolhido, e pode ser removido antes de salvar.
2. **Given** um e-mail já foi adicionado à lista de pendentes, **When** o usuário tenta adicionar o mesmo e-mail novamente, **Then** o sistema impede a duplicidade e mantém apenas uma entrada para aquele e-mail.
3. **Given** a lista de pendentes tem um ou mais e-mails, **When** o usuário confirma "Criar painel", **Then** o painel é criado e, para cada e-mail da lista, um convite é enviado (associação direta se a conta já existir, e-mail de convite caso contrário), sem que o dono veja diferença de fluxo entre os dois casos.
4. **Given** o campo de e-mail no formulário de convite, **When** o usuário digita um valor em formato inválido, **Then** o sistema mostra um erro de validação e impede a adição à lista.
5. **Given** a seção "Usuários (opcional)" está vazia, **When** o usuário não adiciona ninguém, **Then** o painel é criado normalmente apenas com o dono, sem nenhum convite disparado.

---

### User Story 2 - Responder a um convite recebido por e-mail (Priority: P1)

A pessoa convidada recebe um e-mail com um link de convite e, ao abri-lo, vê quem a convidou, para qual painel e com qual papel, podendo aceitar ou recusar.

**Why this priority**: Sem essa tela o convite disparado na User Story 1 nunca é concluído — a pessoa convidada não tem como entrar no painel nem recusar o convite. É o segundo elo indispensável do fluxo ponta a ponta.

**Independent Test**: Acessar o link de um convite pendente (com e o sem sessão ativa) e confirmar que os dados do convite (painel, quem convidou, papel) aparecem corretamente e que os botões Aceitar/Recusar estão disponíveis; pode ser testado assim que existir ao menos um convite pendente gerado manualmente via API.

**Acceptance Scenarios**:

1. **Given** um link de convite válido e pendente, **When** a pessoa convidada (não autenticada) abre o link, **Then** ela é levada a fazer login ou se cadastrar antes de ver a decisão do convite, e retorna ao convite após concluir.
2. **Given** um link de convite válido e pendente, **When** a pessoa convidada autenticada abre o link, **Then** a página mostra o nome do painel, quem convidou e o papel oferecido, com ações para aceitar ou recusar.
3. **Given** um link de convite expirado, **When** a pessoa abre o link, **Then** a página informa que o convite expirou e não oferece as ações de aceitar/recusar.
4. **Given** um link de convite que já foi aceito ou recusado anteriormente, **When** a pessoa abre o link novamente, **Then** a página mostra o status já definido, sem permitir uma nova decisão.
5. **Given** um token de convite inexistente ou inválido, **When** a pessoa abre o link, **Then** a página mostra uma mensagem de erro apropriada.

---

### User Story 3 - Ver confirmação da decisão do convite (Priority: P2)

Depois de aceitar ou recusar, a pessoa convidada vê uma confirmação clara do que aconteceu, incluindo um caminho direto para o painel quando aceitar.

**Why this priority**: Refina a experiência da User Story 2 — o fluxo funciona sem uma tela de confirmação dedicada (poderia reaproveitar a mesma tela em outro estado), mas uma confirmação explícita reduz confusão sobre se a ação realmente ocorreu.

**Independent Test**: A partir da tela de convite pendente (US2), clicar em Aceitar e verificar a tela de confirmação com link para o painel; clicar em Recusar em outro convite e verificar a tela de confirmação de recusa. Testável assim que US2 estiver funcional.

**Acceptance Scenarios**:

1. **Given** um convite pendente sendo visualizado, **When** a pessoa clica em "Aceitar", **Then** o sistema confirma a associação ao painel e exibe uma tela de sucesso com um link para acessar o painel.
2. **Given** um convite pendente sendo visualizado, **When** a pessoa clica em "Recusar", **Then** o sistema confirma a recusa e exibe uma tela informando que nada foi alterado.
3. **Given** a ação de aceitar ou recusar falha por erro de comunicação com o servidor, **When** o erro ocorre, **Then** a pessoa vê uma mensagem de erro e pode tentar novamente sem perder o contexto do convite.

---

### User Story 4 - Acompanhar convites enviados por um painel (Priority: P2) — REMOVIDA DESTA ENTREGA (2026-08-26)

> **Fora de escopo nesta entrega.** Foi implementada como uma aba dedicada em `painel-detalhe`,
> testada e depois removida a pedido do usuário: a visualização/reenvio de convites vai morar
> dentro do botão "Usuários" já existente na tela de detalhe (fluxo da issue #22 — "Criar tela de
> gerenciar usuários de um painel"), não como uma aba separada. `ConviteService.listarConvites` e
> `criarConvite` (usado para reenvio) já existem e cobrem os requisitos abaixo — a issue #22 deve
> consumi-los ao implementar essa tela, em vez de reespecificar o contrato.

O dono do painel quer ver, a qualquer momento, todos os convites que já enviou para aquele painel e o status de cada um (pendente, aceito, recusado, expirado), podendo reenviar um convite que não teve sucesso.

**Why this priority**: Sem esta tela, o dono fica sem visibilidade sobre se os convites da US1 foram respondidos, criando incerteza e possível trabalho duplicado (convidar a mesma pessoa de novo sem saber que já existe convite pendente). Depende de US1 já existir para ter dados para mostrar.

**Independent Test**: Com um painel que já tem convites em diferentes status (pendente, aceito, recusado, expirado), abrir a aba "Convites enviados" na tela de detalhe do painel e verificar que cada convite aparece com e-mail, papel, status e data corretos, testável de forma independente das demais telas usando dados de convites já existentes.

**Acceptance Scenarios**:

1. **Given** um painel com convites enviados em diferentes status, **When** o dono abre a aba "Convites enviados" na tela de detalhe do painel, **Then** a lista mostra e-mail, papel oferecido, status e data de envio de cada convite.
2. **Given** um painel sem nenhum convite enviado, **When** o dono abre a aba "Convites enviados", **Then** a tela mostra um estado vazio explicando que nenhum convite foi enviado ainda.
3. **Given** um convite com status "Recusado" ou "Expirado", **When** o dono aciona a opção de reenviar, **Then** um novo convite é disparado para o mesmo e-mail e papel, e a lista reflete a atualização.
4. **Given** um usuário que não é dono do painel, **When** ele acessa a tela de detalhe do painel, **Then** a aba "Convites enviados" não é exibida para ele.

---

### Edge Cases

- O que acontece quando o e-mail informado ao criar o painel é o do próprio usuário logado (convidar a si mesmo)? O sistema deve impedir a adição à lista com uma mensagem clara.
- O que acontece quando já existe um convite pendente para o mesmo e-mail + painel e um novo convite é disparado (na criação do painel ou por reenvio)? O convite mais recente deve prevalecer, sem gerar múltiplos convites pendentes conflitantes para o mesmo par e-mail/painel.
- Como o sistema se comporta se o link de convite for aberto em um navegador diferente do usado para o cadastro, ou em uma aba anônima? O fluxo de login/cadastro deve funcionar normalmente e retornar ao convite ao final.
- O que acontece se o painel referenciado por um convite for excluído antes da resposta? O link de convite deve informar que o painel não existe mais, em vez de erro genérico.
- O que acontece se o dono tentar convidar mais pessoas do que o limite de usuários por painel (se houver)? Fora de escopo desta entrega — nenhum limite de usuários por painel é validado aqui.
- O que acontece quando o e-mail informado já pertence a uma conta que já é membro daquele painel? O frontend permite a adição normalmente à lista de pendentes (sem validação client-side desse caso) e envia o convite como de costume — o comportamento resultante (rejeição, no-op ou alteração de papel) é decidido pelo backend, fora de escopo desta entrega.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir, na criação de um painel, adicionar zero ou mais convites à lista de pendentes informando e-mail e papel (Adm, Membro ou Visualizador) antes de o painel ser efetivamente criado.
- **FR-002**: O sistema MUST validar o formato do e-mail informado antes de permitir sua adição à lista de pendentes.
- **FR-003**: O sistema MUST impedir a adição de e-mails duplicados na mesma lista de pendentes de um painel em criação.
- **FR-004**: O sistema MUST impedir que o usuário adicione o próprio e-mail (do usuário logado) à lista de convites.
- **FR-005**: O sistema MUST permitir remover um e-mail da lista de pendentes antes da criação do painel.
- **FR-006**: Ao confirmar a criação do painel, o sistema MUST disparar um convite (associação direta ou e-mail de convite, conforme a conta já exista ou não) para cada e-mail presente na lista de pendentes, sem exigir nenhuma ação adicional do dono do painel.
- **FR-007**: O sistema MUST permitir a criação de um painel mesmo quando a lista de pendentes está vazia, sem disparar nenhum convite.
- **FR-008**: O sistema MUST oferecer uma página acessível por link de convite (identificado por um token único) onde a pessoa convidada visualiza o nome do painel, quem a convidou (a API resolve essa informação a partir do próprio convite) e o papel oferecido.
- **FR-009**: O sistema MUST exigir que a pessoa esteja autenticada antes de permitir aceitar ou recusar um convite, redirecionando-a para login/cadastro e retornando ao convite ao concluir, quando necessário.
- **FR-010**: O sistema MUST permitir que a pessoa convidada aceite um convite pendente, associando-a ao painel com o papel definido no convite.
- **FR-011**: O sistema MUST permitir que a pessoa convidada recuse um convite pendente, sem alterar sua associação a nenhum painel.
- **FR-012**: O sistema MUST identificar e comunicar claramente quando um convite está expirado, não permitindo mais aceitá-lo ou recusá-lo nesse estado.
- **FR-013**: O sistema MUST identificar e comunicar claramente quando um convite já foi respondido anteriormente (aceito ou recusado), não permitindo uma nova decisão sobre ele.
- **FR-014**: O sistema MUST identificar e comunicar claramente quando o token de convite acessado é inválido ou inexistente.
- **FR-015**: O sistema MUST exibir uma confirmação após a pessoa aceitar um convite, incluindo um caminho direto para acessar o painel.
- **FR-016**: O sistema MUST exibir uma confirmação após a pessoa recusar um convite, deixando claro que nenhuma alteração foi feita.
- **FR-017** _(deferida para a issue #22 — ver nota em User Story 4)_: O sistema MUST oferecer, na tela de detalhe do painel, uma forma de visualizar convites enviados, visível apenas para o dono do painel.
- **FR-018** _(deferida para a issue #22)_: A visualização de convites MUST listar, para cada convite retornado pela API, o e-mail do convidado, o papel oferecido, o status atual (Pendente, Aceito, Recusado ou Expirado) e a data de envio, exibindo exatamente os registros retornados pelo backend, sem nenhuma deduplicação, agrupamento ou merge feito no frontend.
- **FR-019** _(deferida para a issue #22)_: O sistema MUST permitir ao dono reenviar um convite com status Recusado ou Expirado para o mesmo e-mail e papel originais; após o reenvio, a lista MUST ser recarregada a partir da API para refletir o que o backend retornar (seja substituição da entrada, seja um novo registro histórico).
- **FR-020** _(deferida para a issue #22)_: O sistema MUST exibir uma mensagem de estado vazio na visualização de convites quando o painel não tiver nenhum convite registrado.
- **FR-021**: O sistema MUST comunicar de forma amigável qualquer falha de comunicação ao adicionar convites, aceitar, recusar ou reenviar, permitindo nova tentativa sem perda do contexto atual do usuário.

### Key Entities *(include if feature involves data)*

- **Convite**: Representa um convite de participação em um painel enviado a um e-mail específico. Atributos principais: e-mail do convidado, painel de destino, papel oferecido (Adm/Membro/Visualizador), status (Pendente, Aceito, Recusado, Expirado), data de criação, data de expiração, token de acesso único.
- **Painel**: Grupo que organiza entradas e saídas financeiras, associado a um dono e a uma lista de usuários com papéis. Já existente; esta feature adiciona a capacidade de vincular usuários via convite por e-mail em vez de apenas por ID direto.
- **Usuário convidado (pendente)**: Representação temporária, apenas no formulário de criação de painel, de um e-mail + papel ainda não confirmado — existe somente no estado local da tela até a criação do painel ser confirmada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue adicionar um convidado por e-mail ao criar um painel e concluir a criação em menos de 1 minuto, sem precisar sair da tela de criação do painel.
- **SC-002**: 100% dos convites disparados (associação direta ou e-mail de convite) refletem corretamente o papel escolhido pelo dono do painel.
- **SC-003**: Uma pessoa convidada consegue entender, sem precisar de explicação externa, quem a convidou, para qual painel e com qual papel, em até 5 segundos de leitura da página de convite.
- **SC-004** _(deferida para a issue #22)_: O dono do painel consegue identificar o status de qualquer convite enviado (pendente, aceito, recusado ou expirado) sem precisar consultar nenhum canal fora da aplicação (como e-mail ou suporte).
- **SC-005** _(deferida para a issue #22)_: Convites com status Recusado ou Expirado podem ser reenviados pelo dono em no máximo 2 cliques a partir da lista de convites enviados.

## Assumptions

- O backend (`api-dashfinras`) já expõe os endpoints necessários para criar convite, listar convites de um painel, consultar convite por token, aprovar e recusar convite — este trabalho é exclusivamente de consumo desses endpoints no frontend, sem alterações de backend.
- O prazo de expiração do convite é definido e controlado pelo backend; o frontend apenas exibe o estado "Expirado" retornado pela API, sem lógica própria de cálculo de expiração.
- O envio do e-mail de convite (quando a conta ainda não existe) é responsabilidade do backend; o frontend não compõe nem envia e-mails.
- O papel "Dono" não é selecionável ao convidar — apenas Adm, Membro e Visualizador, conforme os papéis já existentes no domínio de painel.
- Um usuário só pode ser dono do próprio painel; não é possível transferir a titularidade via convite nesta entrega.
- Não há limite de quantidade de convites pendentes ou de usuários por painel definido nesta entrega — qualquer limite fica fora de escopo até ser especificado separadamente.
- A página de convite (/convites/:token) é pública no sentido de ser acessível sem sessão prévia, mas exige autenticação (login ou cadastro) antes de permitir aceitar/recusar, reaproveitando o fluxo de autenticação já existente na aplicação.
- Reenviar um convite (FR-019) gera um novo convite/token para o mesmo e-mail e papel, substituindo o anterior como referência ativa — não há histórico de múltiplos convites simultâneos para o mesmo par e-mail/painel.
