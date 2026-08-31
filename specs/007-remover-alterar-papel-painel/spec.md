# Feature Specification: Remover usuário e alterar papel no painel

**Feature Branch**: `[007-remover-alterar-papel-painel]`

**Created**: 2026-08-27

**Status**: Implemented

**Input**: User description: "Agora vamos iniciar a issue de gerenciar os usuários do painel seguindo os modelos de design já definidos" — entrega incremental sobre a spec 002 (`gerenciar-usuarios-painel`, já implementada no PR #33): a api-dashfinras passou a expor `DELETE /api/painel/{id}/usuario/{idUsuario}` e `PUT /api/painel/{id}/usuario/{idUsuario}/permissao` (PR #45 do api-dashfinras), então esta entrega conecta o modal "Usuários do painel" já existente às duas ações que ficaram bloqueadas na 002 por falta de endpoint: remover um membro do painel e alterar o papel de um membro já existente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remover um usuário do painel (Priority: P1)

O Dono ou um Administrador do painel quer remover o vínculo de outra pessoa com o painel diretamente no modal "Usuários do painel", sem precisar de suporte manual.

**Why this priority**: É a lacuna mais visível deixada pela entrega anterior — hoje não existe nenhuma forma de tirar alguém do painel pela UI, mesmo quando o backend já suporta a operação.

**Independent Test**: Como Dono de um painel com 3 membros, abrir o modal "Usuários do painel", remover um Membro e confirmar que ele desaparece da lista imediatamente, sem fechar/reabrir o modal.

**Acceptance Scenarios**:

1. **Given** o modal "Usuários do painel" aberto por um Dono ou Administrador, **When** ele aciona a remoção de um membro que não é o Dono do painel, **Then** o sistema pede confirmação antes de efetivar a remoção.
2. **Given** a confirmação de remoção, **When** a operação é concluída com sucesso, **Then** o membro removido desaparece da lista imediatamente, sem recarregar a página.
3. **Given** o modal aberto, **When** o usuário logado tenta remover a si mesmo (sair do painel), **Then** o sistema permite a ação (auto-remoção), pede confirmação e, após concluir, fecha o modal e tira o usuário da tela de detalhe desse painel (ele não é mais membro).
4. **Given** o modal aberto, **When** o usuário olha a linha do Dono do painel, **Then** nenhum controle de remoção é exibido para essa linha — o Dono nunca pode ser removido.
5. **Given** um Administrador (não Dono) tentando remover outro Administrador, **When** a ação é confirmada, **Then** o sistema permite a remoção normalmente (Administradores podem remover outros Administradores, exceto o Dono).
6. **Given** uma falha de comunicação ao remover um usuário, **When** o erro ocorre, **Then** o sistema exibe uma mensagem de erro amigável, mantém o membro na lista e permite tentar novamente.

---

### User Story 2 - Alterar o papel de um membro já existente (Priority: P2)

O Dono ou um Administrador do painel quer mudar o papel (Adm, Membro ou Visualizador) de alguém que já é membro, sem precisar remover e readicionar a pessoa.

**Why this priority**: Complementa a remoção como segunda ação que ficou bloqueada na entrega anterior; tem valor um pouco menor porque remover-e-readicionar já seria um contorno funcional, ainda que pior, para o mesmo resultado.

**Independent Test**: Como Dono de um painel com um Membro, abrir o modal, selecionar Administrador para esse Membro, clicar em "Concluído" e confirmar que a lista reflete o novo papel e o modal fecha.

**Acceptance Scenarios**:

1. **Given** o modal "Usuários do painel" aberto por um Dono ou Administrador, **When** ele seleciona um novo papel (Adm, Membro ou Visualizador) para um membro que não é o Dono nem ele mesmo, **Then** o sistema registra a escolha como pendente, sem chamar a API imediatamente — a linha reflete a escolha, mas nada é persistido ainda.
2. **Given** uma ou mais alterações de papel pendentes, **When** o usuário clica em "Concluído", **Then** o sistema salva todas as alterações pendentes e só fecha o modal quando todas forem confirmadas com sucesso pela API.
3. **Given** a linha do próprio usuário logado, **When** ele olha os controles disponíveis, **Then** nenhum controle de alteração de papel é exibido para a própria linha — ninguém altera seu próprio papel.
4. **Given** a linha do Dono do painel, **When** o usuário olha os controles disponíveis, **Then** nenhum controle de alteração de papel é exibido para essa linha — o papel de Dono nunca é alterável e nenhum outro membro pode ser promovido a Dono por esta ação.
5. **Given** uma falha ao salvar a alteração de papel de um usuário ao clicar em "Concluído", **When** o erro ocorre, **Then** o sistema mantém o modal aberto, exibe a mensagem de erro amigável abaixo do nome/e-mail daquele usuário especificamente, preserva a seleção pendente dele para nova tentativa, e aplica normalmente as demais alterações pendentes que tiveram sucesso.

---

### Edge Cases

- O que acontece se dois Administradores agirem quase ao mesmo tempo (um remove, outro tenta alterar o papel do mesmo membro)? A ação mais tardia recebe erro da API (vínculo não encontrado ou sem permissão) e o sistema exibe mensagem amigável, atualizando a lista para refletir o estado real.
- O que acontece se um Administrador tentar remover ou alterar o papel do Dono pela API diretamente (contornando a UI)? Fora de escopo desta tela — a API já rejeita a operação; a UI apenas não oferece esse controle.
- O que acontece se o usuário logado se autorremove enquanto está no meio de outra ação no modal (ex.: adicionando alguém)? A autorremoção só é permitida como ação isolada; enquanto outra operação estiver em andamento, os controles do modal ficam bloqueados até ela concluir (mesmo comportamento já definido na spec 002 para fechamento do modal).
- O que acontece com a lista se a remoção ou alteração de papel falhar após a confirmação? A lista mantém o estado anterior (otimista apenas após sucesso confirmado pela API), evitando mostrar um estado que não aconteceu de fato.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer, para cada linha de membro que não seja o Dono do painel, um controle para remover esse membro do painel, visível apenas para o Dono e para Administradores do painel.
- **FR-002**: O sistema MUST pedir confirmação explícita do usuário antes de efetivar a remoção de um membro.
- **FR-003**: O sistema MUST permitir que o próprio usuário logado remova a si mesmo do painel (sair do painel), desde que ele não seja o Dono.
- **FR-004**: O sistema MUST, após uma auto-remoção bem-sucedida, fechar o modal e deixar de exibir esse painel como acessível ao usuário.
- **FR-005**: O sistema MUST atualizar a lista de membros exibida imediatamente após uma remoção bem-sucedida (exceto no caso de auto-remoção, coberto pelo FR-004), sem exigir fechar/reabrir o modal.
- **FR-006**: O sistema MUST NOT exibir nenhum controle de remoção na linha do Dono do painel.
- **FR-007**: O sistema MUST oferecer, para cada linha de membro que não seja o Dono do painel nem o próprio usuário logado, um controle para alterar o papel desse membro entre Administrador, Membro e Visualizador, visível apenas para o Dono e para Administradores do painel.
- **FR-008**: O sistema MUST NOT exibir nenhum controle de alteração de papel na linha do Dono do painel nem na linha do próprio usuário logado.
- **FR-009**: O sistema MUST NOT oferecer "Dono" como opção selecionável ao alterar o papel de um membro — a promoção a Dono está fora de escopo desta entrega.
- **FR-010**: O sistema MUST adiar a chamada à API de alteração de papel até o usuário clicar em "Concluído" — selecionar um novo papel apenas registra a escolha como pendente, sem persistir nada.
- **FR-010a**: O sistema MUST, ao clicar em "Concluído", salvar todas as alterações de papel pendentes e só fechar o modal quando todas forem confirmadas com sucesso; se pelo menos uma falhar, o modal permanece aberto.
- **FR-011**: O sistema MUST comunicar de forma amigável qualquer falha ao remover um membro ou ao salvar uma alteração de papel pendente, exibindo a mensagem de erro de alteração de papel abaixo do nome/e-mail do usuário-alvo específico, mantendo o estado anterior exibido e permitindo nova tentativa.
- **FR-012**: O sistema MUST impedir usuários com papel Membro ou Visualizador de acessar qualquer controle de remoção ou alteração de papel (mesma restrição de acesso ao modal já definida na spec 002).
- **FR-013**: O sistema MUST bloquear os controles do modal (remover, seletor de papel, botão "Concluído") enquanto uma remoção estiver em andamento ou enquanto as alterações de papel pendentes estiverem sendo salvas, evitando ações concorrentes sobre a mesma lista.
- **FR-014**: O sistema MUST exibir o modal de confirmação de remoção sempre à frente do modal "Usuários do painel" quando ambos estiverem abertos simultaneamente.

### Key Entities *(include if feature involves data)*

- **Usuário do painel**: Mesma entidade já definida na spec 002 (associação entre conta e painel com um papel). Esta feature adiciona duas operações sobre associações já existentes — remoção do vínculo e alteração do papel — sem mudar seu formato de exibição.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um Dono ou Administrador consegue remover um membro do painel em até 3 ações (abrir controle, confirmar) a partir do modal "Usuários do painel" já aberto.
- **SC-002**: Um Dono ou Administrador consegue alterar o papel de um ou mais membros com uma seleção por pessoa e um único clique em "Concluído", sem sair do modal.
- **SC-003**: 100% das remoções e alterações de papel bem-sucedidas refletem na lista exibida sem exigir recarregar a página.
- **SC-006**: 0% das alterações de papel são persistidas antes do clique em "Concluído" — nenhuma chamada à API ocorre só por selecionar um papel diferente.
- **SC-004**: 0% das linhas do Dono do painel exibem qualquer controle de remoção ou alteração de papel, em qualquer sessão de qualquer usuário.
- **SC-005**: Usuários com papel Membro ou Visualizador nunca veem nenhum controle de remoção ou alteração de papel.

## Assumptions

- O modal "Usuários do painel" e sua lista de membros já existem (entrega da spec 002/issue #22) — esta feature apenas adiciona controles de ação às linhas já renderizadas, não recria a listagem.
- Os endpoints `DELETE /api/painel/{id}/usuario/{idUsuario}` e `PUT /api/painel/{id}/usuario/{idUsuario}/permissao` já existem na `api-dashfinras` e implementam as mesmas regras de permissão descritas nos requisitos acima (Dono nunca removível/alterável; quem remove precisa ser Dono/Administrador ou o próprio alvo; quem altera papel precisa ser Dono/Administrador e não pode alterar o próprio papel nem promover a Dono) — esta feature reflete essas regras na UI, não as reimplementa no cliente além de ocultar controles indevidos.
- A confirmação de remoção é um diálogo simples (ex.: modal de confirmação já padronizado no design system do projeto), sem necessidade de digitar texto de confirmação.
- Segue o mesmo modelo visual (badges de papel, avatares com iniciais) já definido e aprovado na spec 002, sem novo mockup — os novos controles (remover, alterar papel) são adicionados às linhas existentes desse mesmo layout.
- Revisão pós-implementação (feedback do usuário): a alteração de papel foi redesenhada de "aplica na seleção" para "aplica em lote ao clicar em Concluído" (FR-010/FR-010a), com erro exibido por usuário (FR-011). Também foi corrigido um bug de empilhamento visual em que o modal de confirmação de remoção nascia atrás do modal "Usuários do painel" (FR-014) — a remoção em si continua sendo uma ação imediata mediante confirmação explícita, sem alteração de comportamento.
