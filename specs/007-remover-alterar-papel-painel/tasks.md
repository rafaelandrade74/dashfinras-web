---

description: "Task list template for feature implementation"
---

# Tasks: Remover usuário e alterar papel no painel

**Input**: Design documents from `specs/007-remover-alterar-papel-painel/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/usuarios-painel-acoes-api.md, quickstart.md

**Tests**: Não solicitados explicitamente no spec — nenhuma tarefa de teste automatizado formal foi
gerada; validação via `quickstart.md` (Polish) e regressão dos specs `ng test` já existentes.

**Organization**: Tarefas agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual user story a tarefa pertence (US1, US2)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único Angular. Toda a feature vive dentro de `src/app/core/` (DTOs/serviço) e
`src/app/features/painel/painel-detalhe/` (UI) — nenhum arquivo novo fora dali (ver `plan.md` ›
Structure Decision).

---

## Phase 1: Setup

Nenhuma inicialização necessária — projeto já configurado, `PainelService`/`painel-detalhe` já
existem e prontos (issue #22 / spec 002). Único pré-requisito é o backend com os endpoints do
PR #45 disponível.

- [ ] T001 Confirmar que `api-dashfinras` local está no commit com os endpoints
      `DELETE /api/painel/{id}/usuario/{idUsuario}` e
      `PUT /api/painel/{id}/usuario/{idUsuario}/permissao` (PR #45) e que `npm run start:dev` sobe
      UI + BFF localmente com um painel de teste com múltiplos usuários em papéis diferentes
      (pré-requisito manual, sem arquivo de código)

---

## Phase 2: Foundational

Não há tarefas foundational bloqueantes compartilhadas entre as duas stories além da atualização
de tipos/serviço, que cada story faz sobre sua própria operação (ver `data-model.md`: um DTO novo,
usado só por US2; US1 não precisa de DTO). US1 e US2 podem começar imediatamente após o Setup e
avançar em paralelo.

**Checkpoint**: Nada bloqueante — ir direto para as user stories.

---

## Phase 3: User Story 1 - Remover um usuário do painel (Priority: P1) 🎯 MVP

**Goal**: Adicionar, a cada linha de membro (exceto o Dono) do modal "Usuários do painel", um
controle de remoção com confirmação, que chama o novo endpoint de remoção e atualiza a lista
imediatamente — incluindo a autorremoção (sair do painel).

**Independent Test**: Como Dono de um painel com 3 membros, abrir o modal, remover um Membro e
confirmar que ele desaparece da lista sem fechar/reabrir o modal; repetir logado como o próprio
Membro removendo a si mesmo e confirmar que o modal fecha e o painel some da lista de acesso dele.

### Implementation for User Story 1

- [X] T002 [US1] Adicionar `removerUsuarioPainel(idPainel: string, idUsuario: string):
      Observable<ResponsePainelDto>` em `src/app/core/services/painel.service.ts`, chamando
      `DELETE ${baseUrl}/${idPainel}/usuario/${idUsuario}` (ver
      `contracts/usuarios-painel-acoes-api.md`)
- [X] T003 [US1] Adicionar os signals `removendoUsuarioId = signal<string | undefined>(undefined)`
      e `erroRemoverUsuario = signal<string | undefined>(undefined)`, e o estado do modal de
      confirmação `usuarioParaRemover = signal<PainelUsuarioDto | undefined>(undefined)` em
      `src/app/features/painel/painel-detalhe/painel-detalhe.ts`, no mesmo padrão de
      `excluirAberto`/`excluindo`/`erroExcluir` já existente para excluir painel
- [X] T004 [US1] Implementar `abrirRemoverUsuario(usuario: PainelUsuarioDto)` (seta
      `usuarioParaRemover`, limpa `erroRemoverUsuario`) e `fecharRemoverUsuario()` (não fecha se
      `removendoUsuarioId()` estiver definido — operação em curso) em `painel-detalhe.ts` (FR-002,
      Edge Cases › fechamento do modal durante operação)
- [X] T005 [US1] Implementar `confirmarRemoverUsuario()` em `painel-detalhe.ts`: chama
      `painelService.removerUsuarioPainel(painel.id, usuarioParaRemover().id)`; em sucesso,
      atualiza `painel.set(painelAtualizado)` com a resposta (sem nova chamada a `obterPainel` —
      ver `contracts/usuarios-painel-acoes-api.md`), fecha o modal de confirmação; se o usuário
      removido for o próprio usuário logado (`ehUsuarioLogado`), fecha também o modal "Usuários do
      painel" (`usuariosAberto.set(false)`) e navega de volta para `/paineis` (FR-003, FR-004,
      FR-005)
- [X] T006 [US1] Tratar erro de `removerUsuarioPainel()` em `confirmarRemoverUsuario()`: exibir
      `erroRemoverUsuario` com a `descricao` da API (mesmo padrão `Erro[]` já usado em
      `painel-detalhe.ts`), manter `usuarioParaRemover` definido para permitir nova tentativa
      (FR-011)
- [X] T007 [US1] Adicionar o controle de remover (ícone/botão) em cada linha da lista de usuários
      em `painel-detalhe.html`, oculto na linha cujo `usuario.idPermissao === PainelPermissao.Dono`
      (FR-001, FR-006), disparando `abrirRemoverUsuario(usuario)`
- [X] T008 [US1] Adicionar o bloco de modal de confirmação de remoção em `painel-detalhe.html`
      (`@if (usuarioParaRemover())`), reaproveitando a estrutura visual do modal "Excluir painel"
      já existente (`.modal`/`.modal-head`/`.modal-body`/`.modal-foot`), com texto adaptado para
      "sair do painel" quando o alvo for o próprio usuário logado (FR-002)
- [X] T009 [US1] Adicionar estilos necessários (se algum não for reaproveitável de
      `.modal`/`.btn-danger` já existentes) em
      `src/app/features/painel/painel-detalhe/painel-detalhe.scss`

**Checkpoint**: User Story 1 completa e testável de forma independente (remoção de membro e
autorremoção funcionando, com o Dono protegido).

---

## Phase 4: User Story 2 - Alterar o papel de um membro já existente (Priority: P2)

**Goal**: Adicionar, a cada linha de membro que não seja o Dono nem o próprio usuário logado, um
seletor de papel (Adm/Membro/Visualizador) que registra a escolha como pendente e só a persiste
quando o usuário clica em "Concluído" — o modal só fecha quando todas as alterações pendentes
forem salvas com sucesso; falhas aparecem por usuário, abaixo do nome/e-mail.

**Independent Test**: Como Dono de um painel com um Membro, abrir o modal, selecionar Administrador
para esse Membro, clicar em "Concluído" e confirmar que o badge muda na lista e o modal fecha.

### Implementation for User Story 2

- [X] T010 [US2] Adicionar `RequestEditarPermissaoUsuarioPainelDto { permissao: PainelPermissao }`
      em `src/app/core/models/painel.model.ts` (ver `data-model.md`)
- [X] T011 [US2] Adicionar `editarPermissaoUsuarioPainel(idPainel: string, idUsuario: string,
      permissao: PainelPermissao): Observable<ResponsePainelDto>` em
      `src/app/core/services/painel.service.ts`, chamando
      `PUT ${baseUrl}/${idPainel}/usuario/${idUsuario}/permissao` com o corpo
      `{ permissao }` (ver `contracts/usuarios-painel-acoes-api.md`)
- [X] T012 [US2] Adicionar os signals `papeisPendentes = signal<Record<string, PainelPermissao>>({})`,
      `salvandoAlteracoes = signal(false)` e `errosAlterarPapel = signal<Record<string, string>>({})`
      em `painel-detalhe.ts` para refletir seleção pendente, estado de salvamento em lote e erro por
      usuário sem afetar as demais linhas (redesenho pós-feedback: nada persiste antes de
      "Concluído" — ver `spec.md` › Assumptions)
- [X] T013 [US2] Implementar `definirPapelPendente(usuario, novaPermissao)` (registra a escolha em
      `papeisPendentes` sem chamar a API; remove a pendência se a escolha voltar ao papel atual) e
      `papelExibido(usuario)` (retorna o valor pendente ou o atual) em `painel-detalhe.ts` (FR-010)
- [X] T013a [US2] Implementar `concluirUsuarios()` em `painel-detalhe.ts`: se não há pendências,
      apenas fecha o modal; caso contrário, chama `editarPermissaoUsuarioPainel` para cada pendência
      em sequência (`concat`), atualizando `painel()` a cada sucesso; ao final, mantém em
      `papeisPendentes`/`errosAlterarPapel` apenas os que falharam e só fecha o modal se não houver
      nenhum erro (FR-010a, FR-011)
- [X] T014 [US2] Adicionar o seletor de papel em cada linha da lista de usuários em
      `painel-detalhe.html`, com `(change)="definirPapelPendente(usuario, $event)"` e valor exibido
      via `papelExibido(usuario)`, oferecendo apenas as opções de `PAPEIS_CONVITE` (já sem `Dono` —
      ver `painel-criar.ts`), oculto nas linhas cujo `usuario.idPermissao === PainelPermissao.Dono`
      ou `ehUsuarioLogado(usuario.id)` (FR-007, FR-008, FR-009); trocar o botão "Concluído" de
      `fecharUsuarios()` para `concluirUsuarios()`, com spinner enquanto `salvandoAlteracoes()`
- [X] T015 [US2] Bloquear os controles de remover (T007), o seletor de papel (T014) e o botão
      "Concluído" enquanto `removendoUsuarioId()` estiver definido ou `salvandoAlteracoes()` for
      verdadeiro, evitando ações concorrentes (FR-013)
- [X] T015a [US2] Corrigir bug de empilhamento visual: mover o modal de confirmação de remoção para
      depois do modal "Usuários do painel" no template e adicionar a classe `.backdrop-top`
      (`z-index: 110`) a ele, garantindo que fique sempre à frente quando ambos estiverem abertos
      (FR-014)

**Checkpoint**: US1 e US2 completas — modal "Usuários do painel" com remoção e alteração de papel
funcionais de ponta a ponta.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T016 [P] Confirmar foco visível (`:focus-visible`) e `aria-label` nos novos controles
      interativos (botão remover, seletor de papel, botões do modal de confirmação) em
      `painel-detalhe.html`
- [X] T017 [P] Rodar `ng test` e confirmar que os specs existentes (`painel-detalhe.spec.ts`)
      continuam passando, e adicionar casos cobrindo: controle de remover/alterar papel ausente na
      linha do Dono (FR-006, FR-008), ausente na própria linha para alteração de papel (FR-008),
      ausente para usuários Membro/Visualizador (FR-012), e o fluxo de sucesso/erro de cada ação
- [ ] T018 Executar manualmente os 7 cenários de
      `specs/007-remover-alterar-papel-painel/quickstart.md` contra `api-dashfinras` local
- [X] T019 Confirmar regressão: lista de usuários (spec 002, US1) e fluxo de adicionar por e-mail
      (spec 002, US2) continuam funcionando sem alteração de comportamento

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências, exceto backend com PR #45 disponível
- **Foundational (Phase 2)**: Vazia — nada bloqueia as user stories
- **User Stories (Phase 3-4)**: US1 (T002-T009) e US2 (T010-T015) tocam arquivos em comum
  (`painel-detalhe.ts`/`.html`) mas operam sobre ações independentes (remover vs. alterar papel) —
  podem ser implementadas em qualquer ordem; T015 (bloqueio de controles concorrentes) depende de
  ambos os estados (`removendoUsuarioId` de US1 e `alterandoPapelUsuarioId` de US2) já existirem
- **Polish (Phase 5)**: Depende de US1 e US2 completas

### Parallel Opportunities

- T002 (serviço, US1) e T010-T011 (DTO + serviço, US2) podem ser feitas em paralelo (arquivos
  diferentes: nenhum conflito real, mas ambos tocam `painel.service.ts` — coordenar merge)
- T016 e T017 (Polish) podem rodar em paralelo

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1 — remover membro (incluindo autorremoção) já entrega a lacuna
   mais visível deixada pela spec 002
3. **PARAR e VALIDAR**: Cenários 1-3 do quickstart
4. Completar Phase 4: User Story 2 — fecha o ciclo com alteração de papel

### Incremental Delivery

1. Setup → confirmar backend com PR #45 disponível
2. US1 → testar independentemente (remoção, autorremoção, Dono protegido)
3. US2 → testar independentemente (alteração de papel, restrições de linha)
4. Cada story soma valor sem quebrar a anterior nem a spec 002

## Notes

- Nenhum novo componente/rota — toda a feature estende `painel-detalhe.ts`/`.html`/`.scss` e
  `PainelService`/`painel.model.ts` já existentes (ver `contracts/usuarios-painel-acoes-api.md`)
- Promoção a Dono e qualquer regra de negócio adicional continuam de responsabilidade exclusiva da
  API — a UI apenas oculta controles indevidos, não reimplementa as regras (ver `research.md`)
- Commit após cada tarefa ou grupo lógico
