# Feature Specification: Histórico de convites no modal de usuários

**Feature Branch**: `feature/22-gerenciar-usuarios-painel` (continuação — ver Assumptions)

**Created**: 2026-08-26

**Status**: Draft

**Input**: User description: "Adicionar a aba 'Convites enviados' dentro do modal 'Usuários do painel' (issue #22), reincorporando o item 4 do design original de convites (issue #23) que antes era uma aba separada na tela de detalhe do painel e foi removida. Design aprovado: https://claude.ai/code/artifact/95f08c0b-6756-4ad6-bbdc-598e05f488ba — o modal 'Usuários do painel' ganha duas abas: 'Usuários' (já existe, lista somente leitura) e 'Convites enviados' (nova): lista de convites feitos para aquele painel via ConviteService.listarConvites, com e-mail, papel, status (Pendente/Aceito/Recusado/Expirado/Invalidado) e data de envio. Convites com status Recusado/Expirado/Invalidado ganham um botão 'Reenviar' que dispara ConviteService.criarConvite novamente com o mesmo e-mail e papel. Nenhum endpoint novo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o histórico de convites enviados a partir do modal de usuários (Priority: P1)

O Dono ou Adm de um painel, já com o modal "Usuários do painel" aberto, quer alternar para uma aba que mostra todos os convites já enviados para aquele painel e o status de cada um, sem precisar sair do modal.

**Why this priority**: É o valor central desta feature — reincorpora, num lugar mais coerente (dentro do próprio fluxo de gestão de usuários), uma visibilidade que existia antes (issue #23, tela 04) e foi removida. Sem isso, o Dono/Adm não tem nenhuma forma de saber se um convite enviado (seja na criação do painel, seja pelo bloco de adicionar deste mesmo modal) foi aceito, recusado ou expirou.

**Independent Test**: Com um painel que já tem convites em diferentes status, abrir o modal "Usuários do painel", clicar na aba "Convites enviados" e verificar que a lista mostra e-mail, papel, status e data de cada convite, testável de forma independente da aba "Usuários" usando dados de convites já existentes.

**Acceptance Scenarios**:

1. **Given** o modal "Usuários do painel" aberto, **When** o Dono/Adm clica na aba "Convites enviados", **Then** a lista mostra, para cada convite já enviado àquele painel, o e-mail do convidado, o papel oferecido, o status atual e a data de envio.
2. **Given** o modal aberto na aba "Usuários", **When** o usuário volta para a aba "Convites enviados" depois de já tê-la visitado, **Then** a lista não recarrega desnecessariamente (mantém o que já foi buscado nesta sessão do modal).
3. **Given** um painel sem nenhum convite enviado, **When** a aba "Convites enviados" é aberta, **Then** a tela mostra um estado vazio explicando que nenhum convite foi enviado ainda, sem erro.
4. **Given** uma falha ao carregar a lista de convites, **When** o erro ocorre, **Then** a aba mostra uma mensagem de erro amigável, sem quebrar o restante do modal (a aba "Usuários" continua funcionando normalmente).

---

### User Story 2 - Reenviar um convite que não teve sucesso (Priority: P2)

O Dono ou Adm, vendo um convite com status Recusado, Expirado ou Invalidado na lista, quer reenviá-lo sem precisar digitar o e-mail e escolher o papel de novo.

**Why this priority**: Sem isso, a aba "Convites enviados" seria só informativa — o dono ainda precisaria voltar pro bloco de adicionar e digitar tudo de novo manualmente pra tentar de novo com a mesma pessoa. Depende da User Story 1 já existir (precisa da lista visível para ter o que reenviar).

**Independent Test**: Com um convite de status Recusado ou Expirado visível na aba "Convites enviados", clicar em "Reenviar" e verificar que um novo convite é disparado para o mesmo e-mail e papel, sem exigir preencher o formulário de adicionar novamente.

**Acceptance Scenarios**:

1. **Given** um convite com status Recusado, Expirado ou Invalidado na lista, **When** o Dono/Adm clica em "Reenviar", **Then** o sistema dispara um novo convite para o mesmo e-mail e papel do convite original, sem exigir nenhum campo adicional.
2. **Given** um convite com status Pendente ou Aceito, **When** a lista é exibida, **Then** nenhum botão de reenviar aparece para essa linha (só faz sentido reenviar o que não teve sucesso).
3. **Given** um reenvio em andamento, **When** a operação conclui com sucesso, **Then** a lista de convites é atualizada para refletir o resultado retornado pela API, sem nenhuma lógica de deduplicação feita no frontend (mesmo princípio já estabelecido na issue #23).
4. **Given** uma falha ao reenviar, **When** o erro ocorre, **Then** o sistema exibe uma mensagem de erro amigável na aba, sem perder a lista já carregada.

---

### Edge Cases

- O que acontece se o usuário abrir a aba "Convites enviados" antes mesmo do painel ter carregado completamente? A aba só deve ficar acessível depois que o modal já sabe o id do painel (o mesmo id já usado pela aba "Usuários" e pelo bloco de adicionar).
- O que acontece se dois convites diferentes existirem para o mesmo e-mail (um antigo expirado, um novo pendente)? A lista exibe exatamente o que a API retornar — sem nenhuma lógica de merge/ocultação no frontend (mesma decisão já tomada na issue #23 para esse cenário).
- O que acontece se o Dono/Adm reenviar um convite duas vezes seguidas rapidamente? O botão de reenviar deve refletir um estado de carregamento por convite, evitando disparos duplicados enquanto uma chamada anterior ainda está em andamento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer, dentro do modal "Usuários do painel", uma navegação por abas entre "Usuários" (já existente) e "Convites enviados" (nova).
- **FR-002**: A aba "Convites enviados" MUST listar, para cada convite retornado pela API, o e-mail do convidado, o papel oferecido, o status atual e a data de envio, exibindo exatamente os registros retornados pelo backend.
- **FR-003**: O sistema MUST carregar a lista de convites apenas quando a aba "Convites enviados" for acessada pela primeira vez em uma sessão do modal (não obrigatoriamente junto com a lista de usuários), evitando uma chamada de API desnecessária para quem nunca abre essa aba.
- **FR-004**: O sistema MUST exibir um botão de reenviar apenas nas linhas com status Recusado, Expirado ou Invalidado.
- **FR-005**: O sistema MUST, ao reenviar, disparar um novo convite para o mesmo e-mail e papel do convite original, sem exigir preenchimento adicional do usuário.
- **FR-006**: O sistema MUST recarregar a lista de convites a partir da API após um reenvio bem-sucedido, refletindo exatamente o que o backend retornar.
- **FR-007**: O sistema MUST exibir um estado de carregamento individual por linha durante um reenvio em andamento, e impedir novo clique na mesma linha enquanto ela estiver em andamento.
- **FR-008**: O sistema MUST exibir uma mensagem de estado vazio na aba "Convites enviados" quando o painel não tiver nenhum convite registrado.
- **FR-009**: O sistema MUST comunicar de forma amigável qualquer falha ao carregar a lista de convites ou ao reenviar um convite, sem interromper o funcionamento da aba "Usuários" no mesmo modal.
- **FR-010**: O sistema MUST restringir o acesso à aba "Convites enviados" às mesmas condições já aplicadas ao modal inteiro (Dono/Adm apenas — herdado do botão "Usuários" já existente).

### Key Entities *(include if feature involves data)*

- **Convite**: Já definido na especificação da issue #23 (`ResponseConviteDto`) — esta feature apenas consome a listagem já existente (`GET /api/painel/{id}/convites`) e o reenvio (`POST /api/painel/{id}/convites`), sem alterar o modelo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Dono ou Adm consegue ver o status de qualquer convite enviado a um painel em até 2 cliques a partir da tela de detalhe do painel (abrir "Usuários", clicar na aba "Convites enviados").
- **SC-002**: Convites com status Recusado, Expirado ou Invalidado podem ser reenviados em exatamente 1 clique a partir da lista (sem reabrir formulário nenhum).
- **SC-003**: 100% dos reenvios bem-sucedidos refletem na lista exibida sem exigir fechar/reabrir o modal.

## Assumptions

- Esta feature depende diretamente do modal "Usuários do painel" implementado na issue #22 (PR #33), ainda não mergeado em `develop` no momento desta especificação. Por isso, ao contrário do padrão normal do projeto (branch nova a partir de `develop`), o trabalho continua na mesma branch `feature/22-gerenciar-usuarios-painel` — abrir uma branch nova a partir de `develop` não teria o modal para estender. Se `develop` for atualizada com o merge da issue #22 antes desta implementação começar, reavaliar se vale abrir uma branch própria a partir da `develop` atualizada.
- Nenhum DTO ou endpoint novo — reaproveita integralmente `ConviteService`, `RequestCriarConviteDto`, `ResponseConviteDto`, `ResponseConvitesDto` e `StatusConvite` já criados na issue #23.
- O comportamento de "reenviar" (FR-005/FR-006) segue exatamente a mesma decisão já registrada na issue #23: reenviar é apenas criar um novo convite para o mesmo e-mail/painel; o frontend não decide se isso substitui ou soma um registro na lista — só exibe o que a API retornar.
- A aba "Usuários" (já implementada) não é alterada por esta feature, exceto pela adição da navegação por abas ao seu redor.
