# Feature Specification: Gerenciar usuários do painel

**Feature Branch**: `feature/22-gerenciar-usuarios-painel`

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "Issue #22 do dashfinras-web: Criar tela de gerenciar usuários de um painel. Design aprovado (mockup https://claude.ai/code/artifact/95f08c0b-6756-4ad6-bbdc-598e05f488ba): modal 'Usuários do painel' aberto pelo botão 'Usuários' na tela de detalhe (só Dono/Adm), com bloco de adicionar usuário por e-mail + papel (reaproveitando exatamente o mesmo comportamento da issue #23 — associação direta se a conta existir, convite por e-mail se não existir) e a lista de membros atuais do painel, somente leitura (avatar, nome com tag '(você)' quando aplicável, e-mail, badge de papel). Escopo reduzido: a api-dashfinras hoje não tem endpoint para remover um usuário do painel nem para alterar o papel de um membro já existente (PUT /api/painel/{id}/adicionar-usuario é só inserção — passar o id de quem já é membro não faz nada, é filtrado como 'já adicionado'). Por isso remover e alterar papel de membro existente ficam fora desta entrega, documentados como bloqueados por falta de endpoint no backend. Depende da tela de detalhe do painel (issue #19), já existente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver os usuários atuais do painel (Priority: P1)

O Dono ou Adm de um painel quer ver rapidamente quem tem acesso àquele painel e com qual papel, a partir da tela de detalhe do painel.

**Why this priority**: É o valor mínimo da tela — sem visibilidade da lista atual, não há como decidir se e quem convidar, nem confirmar que um convite anterior (issue #23) já resultou em alguém entrando no painel. Funciona de forma independente mesmo sem a capacidade de adicionar (embora nesta entrega as duas venham juntas).

**Independent Test**: Abrir um painel com múltiplos usuários (dono + outros papéis) como Dono, clicar em "Usuários" e verificar que a lista mostra cada pessoa com avatar, nome, e-mail e papel corretos, incluindo a indicação de qual é o usuário logado.

**Acceptance Scenarios**:

1. **Given** um painel com 4 usuários (Dono, Adm, Membro, Visualizador), **When** o Dono clica em "Usuários" na tela de detalhe do painel, **Then** um modal abre mostrando os 4 usuários, cada um com avatar (iniciais), nome, e-mail e um indicador visual do papel.
2. **Given** o modal "Usuários do painel" aberto, **When** o usuário logado está entre os listados, **Then** a linha dele exibe uma indicação de que é o próprio usuário (ex.: "(você)").
3. **Given** um painel com um único usuário (só o Dono), **When** o modal é aberto, **Then** a lista mostra apenas o Dono, sem erro nem estado vazio (o Dono sempre existe).
4. **Given** um usuário com papel Membro ou Visualizador, **When** ele acessa a tela de detalhe do painel, **Then** o botão "Usuários" não é exibido para ele (ação restrita a Dono/Adm).

---

### User Story 2 - Adicionar usuário ao painel por e-mail (Priority: P1)

O Dono ou Adm quer adicionar uma nova pessoa ao painel diretamente pelo modal "Usuários do painel", informando e-mail e papel, sem precisar abrir o fluxo de criação de painel.

**Why this priority**: É o segundo pilar de valor da tela — sem isso, o modal seria só uma lista estática, e a única forma de convidar alguém continuaria sendo no momento da criação do painel (issue #23), o que não ajuda quem quer crescer um painel já existente.

**Independent Test**: Com o modal "Usuários do painel" aberto, informar um e-mail já cadastrado com papel "Membro", confirmar que a pessoa aparece imediatamente na lista com esse papel; repetir com um e-mail sem cadastro e confirmar que nenhum erro aparece (o convite é disparado por e-mail).

**Acceptance Scenarios**:

1. **Given** o modal "Usuários do painel" aberto, **When** o usuário informa um e-mail válido, escolhe um papel (Adm, Membro ou Visualizador) e confirma a adição, **Then** o sistema tenta adicionar essa pessoa ao painel com o papel escolhido, usando o mesmo comportamento de e-mail+papel já existente na criação de painel (issue #23): associação direta se a conta já existir, convite por e-mail caso contrário.
2. **Given** uma adição bem-sucedida por e-mail já cadastrado, **When** a operação conclui, **Then** a lista de usuários do modal é atualizada imediatamente para incluir a nova pessoa, sem precisar fechar e reabrir o modal.
3. **Given** uma adição por e-mail sem conta, **When** a operação conclui, **Then** o sistema confirma que o convite foi enviado, sem exibir a pessoa na lista de membros atuais (ela só aparece ali quando aceitar o convite).
4. **Given** o campo de e-mail, **When** o usuário informa um e-mail em formato inválido ou tenta adicionar o próprio e-mail (usuário logado) ou um e-mail que já está na lista de membros atuais, **Then** o sistema impede a ação com uma mensagem clara, sem chamar a API.
5. **Given** uma falha de comunicação ao adicionar um usuário, **When** o erro ocorre, **Then** o sistema exibe uma mensagem de erro amigável e permite tentar novamente sem perder o que já foi preenchido.

---

### Edge Cases

- O que acontece se o Dono ou Adm tentar adicionar um e-mail que já pertence a um membro atual do painel? O sistema bloqueia a tentativa antes de chamar a API (mesma lógica de duplicidade da issue #23), evitando uma chamada que a API silenciosamente ignoraria.
- O que acontece se um Adm (não Dono) abrir o modal? Ele vê a mesma lista e o mesmo bloco de adicionar que o Dono; a diferenciação de papéis dentro do modal (ex.: impedir Adm de rebaixar o Dono) não se aplica nesta entrega porque não há ação de alterar papel disponível.
- O que acontece com o papel do Dono na lista? É sempre exibido como "Dono", nunca editável nem removível — nesta entrega isso é automático, já que nenhuma linha tem controle de edição/remoção.
- O que acontece se o painel tiver muitos usuários (lista longa)? A lista deve permanecer navegável (rolagem) dentro do modal sem quebrar o layout.
- O que acontece se o usuário fechar o modal no meio de uma adição em andamento? A operação em andamento não deve ser interrompida de forma inconsistente — o fechamento deve esperar a operação atual ou ser bloqueado enquanto ela estiver em curso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer um botão "Usuários" na tela de detalhe do painel, visível apenas para o Dono e para Administradores do painel.
- **FR-002**: O sistema MUST abrir, ao clicar em "Usuários", uma visualização com a lista completa dos usuários atuais do painel, cada um exibindo avatar (iniciais), nome, e-mail e papel.
- **FR-003**: O sistema MUST indicar visualmente, na lista de usuários, qual linha corresponde ao usuário atualmente logado.
- **FR-004**: O sistema MUST permitir adicionar um novo usuário ao painel informando e-mail e papel (Adm, Membro ou Visualizador), reaproveitando o mesmo comportamento de resolução por e-mail definido na issue #23 (associação direta para conta existente, convite por e-mail caso contrário).
- **FR-005**: O sistema MUST validar o formato do e-mail antes de permitir a adição.
- **FR-006**: O sistema MUST impedir a adição do e-mail do próprio usuário logado.
- **FR-007**: O sistema MUST impedir a adição de um e-mail que já pertence a um membro atual do painel (comparando com a lista já carregada), sem depender de erro da API para isso.
- **FR-008**: O sistema MUST atualizar a lista de usuários exibida imediatamente após uma adição bem-sucedida por conta já existente, sem exigir fechar/reabrir o modal.
- **FR-009**: O sistema MUST confirmar ao usuário quando um convite por e-mail foi enviado com sucesso para um e-mail sem conta existente, deixando claro que a pessoa ainda não é membro até aceitar.
- **FR-010**: O sistema MUST comunicar de forma amigável qualquer falha ao carregar a lista de usuários ou ao adicionar um novo usuário, permitindo nova tentativa sem perda dos dados já preenchidos no formulário de adição.
- **FR-011**: O sistema MUST NOT oferecer, nesta entrega, nenhuma ação de remover um usuário do painel ou de alterar o papel de um usuário que já é membro — nenhum controle interativo para essas ações deve aparecer na tela.
- **FR-012**: O sistema MUST exibir o papel de cada usuário (incluindo o Dono) apenas como informação, nunca como campo editável, nesta entrega.
- **FR-013**: O sistema MUST impedir o acesso de usuários com papel Membro ou Visualizador ao botão/modal "Usuários" — a ação não é exibida para eles.

### Key Entities *(include if feature involves data)*

- **Usuário do painel**: Representa a associação entre uma conta e um painel, com um papel (Dono, Adm, Membro, Visualizador). Já existente (`ResponsePainelDto.usuarios`); esta feature apenas exibe essa lista e permite adicionar novas associações por e-mail, sem alterar seu formato.
- **Adição por e-mail**: Mesma entidade "Convite"/associação direta já definida na especificação da issue #23 — esta feature não introduz um novo conceito, apenas um segundo ponto de entrada (o modal de usuários) para o mesmo fluxo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Dono ou Adm consegue ver a lista completa de usuários de um painel em até 2 cliques a partir da tela de detalhe do painel (clicar em "Usuários" e pronto).
- **SC-002**: Um Dono ou Adm consegue adicionar um novo usuário por e-mail ao painel em menos de 30 segundos, sem sair da tela de detalhe do painel.
- **SC-003**: 100% das adições bem-sucedidas por e-mail já cadastrado refletem na lista de usuários do modal sem exigir recarregar a página.
- **SC-004**: Usuários com papel Membro ou Visualizador nunca veem nenhum controle de gerenciamento de usuários (nem o botão que abriria o modal).

## Assumptions

- O botão "Usuários" já existe visualmente na tela de detalhe do painel (`painel-detalhe.html`, ação já presente no cabeçalho, hoje sem ação associada) — esta feature conecta esse botão à nova visualização, não precisa criá-lo do zero.
- O mesmo `ConviteService`/DTOs criados na issue #23 (`RequestCriarConviteDto`, `ResponseConviteDto`) são reaproveitados aqui sem alteração de contrato — a adição por e-mail nesta tela é uma segunda superfície de UI para o mesmo comportamento de backend, não um novo endpoint.
- Remover um usuário do painel e alterar o papel de um membro já existente estão fora de escopo desta entrega porque a API (`api-dashfinras`) não oferece esses endpoints hoje (`PUT /api/painel/{id}/adicionar-usuario` é estritamente de inserção — passar o id de um membro já existente é silenciosamente ignorado pela API, sem erro e sem efeito). Essas capacidades ficam para uma entrega futura, condicionadas à criação dos endpoints correspondentes no backend.
- A distinção entre Dono e Adm quanto a "quem pode remover quem" (mencionada no mockup original) não se aplica nesta entrega, já que nenhuma ação de remoção existe (ver FR-011).
- A lista de usuários é obtida a partir do mesmo `ResponsePainelDto` já carregado pela tela de detalhe do painel (via `PainelService.obterPainel`), sem necessidade de uma nova chamada de API dedicada a listar usuários.
