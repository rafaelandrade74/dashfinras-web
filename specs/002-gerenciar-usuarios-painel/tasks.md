---

description: "Task list template for feature implementation"
---

# Tasks: Gerenciar usuários do painel

**Input**: Design documents from `specs/002-gerenciar-usuarios-painel/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/usuarios-painel-api.md,
quickstart.md

**Tests**: Não solicitados explicitamente no spec — nenhuma tarefa de teste automatizado formal foi
gerada; validação via `quickstart.md` (Polish) e regressão dos specs `ng test` já existentes.

**Organization**: Tarefas agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual user story a tarefa pertence (US1, US2)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único Angular. Toda a feature vive dentro de
`src/app/features/painel/painel-detalhe/` — nenhum arquivo novo fora dali (ver `plan.md` ›
Structure Decision: reaproveita `ConviteService`/`PainelService` de `core/` sem alteração).

---

## Phase 1: Setup

Nenhuma inicialização necessária — projeto já configurado, `ConviteService`/`PainelService`
já existem e prontos (issues #19 e #23).

- [ ] T001 Confirmar que `npm run start:dev` sobe UI + BFF localmente com um painel de teste que
      já tenha múltiplos usuários (pré-requisito manual, sem arquivo de código; pode usar o fluxo
      de convite da issue #23 pra popular)

---

## Phase 2: Foundational

Não há tarefas foundational bloqueantes — não há modelo/serviço novo (ver `data-model.md`: zero
DTOs novos). US1 e US2 podem começar imediatamente após o Setup.

**Checkpoint**: Nada bloqueante — ir direto para as user stories.

---

## Phase 3: User Story 1 - Ver os usuários atuais do painel (Priority: P1) 🎯 MVP

**Goal**: Conectar o botão "Usuários" (já existe em `painel-detalhe.html`, hoje sem `(click)`) a um
modal que lista os membros atuais do painel, somente leitura, indicando qual é o usuário logado.

**Independent Test**: Abrir um painel com múltiplos usuários como Dono, clicar em "Usuários" e
verificar que a lista mostra avatar, nome, e-mail e papel de cada um, com o usuário logado marcado.

### Implementation for User Story 1

- [X] T002 [US1] Adicionar `readonly usuariosAberto = signal(false)` e os métodos
      `abrirUsuarios()`/`fecharUsuarios()` em
      `src/app/features/painel/painel-detalhe/painel-detalhe.ts`, no mesmo padrão de
      `renomearAberto`/`abrirRenomear()`/`fecharRenomear()` já existentes
- [X] T003 [US1] Conectar `(click)="abrirUsuarios()"` ao botão "Usuários" existente em
      `src/app/features/painel/painel-detalhe/painel-detalhe.html` (linha do botão dentro de
      `@if (podeGerenciar)`, já restrito a Dono/Adm — FR-001, FR-013)
- [X] T004 [US1] Adicionar o bloco de modal "Usuários do painel" em
      `src/app/features/painel/painel-detalhe/painel-detalhe.html` (novo `@if (usuariosAberto())`
      ao final do arquivo, mesmo nível dos blocos de `renomearAberto()`/`excluirAberto()`) com a
      lista de `painel()?.usuarios`: avatar (iniciais via `iniciaisUsuario`, já existente), nome,
      e-mail, badge de papel (reaproveitar `PAPEL_INFO`/classe já usada no badge do cabeçalho) —
      seguindo o artboard aprovado (FR-002)
- [X] T005 [US1] Adicionar indicação "(você)" na linha do usuário logado dentro do modal, comparando
      `usuario.id` com `accountService.usuarioAtual?.id` (mesmo padrão de comparação já usado em
      `papelDoUsuario`/`podeGerenciar`/`podeExcluir`) (FR-003)
- [X] T006 [US1] Adicionar os estilos do modal "Usuários do painel" (`.user-list`, `.user-row`,
      `.avatar` reaproveitado, `.badge` reaproveitado, scroll interno pra listas longas) em
      `src/app/features/painel/painel-detalhe/painel-detalhe.scss`, reaproveitando ao máximo classes
      já existentes (`.avatar`, `.avatar-teal/-accent/-ink`, `.badge`, `.badge-dono/-adm/-membro/-visualizador`,
      `.modal`/`.modal-head`/`.modal-body`/`.modal-foot` já usados por Renomear/Excluir)

**Checkpoint**: User Story 1 completa e testável de forma independente (lista visível, sem a parte
de adicionar ainda).

---

## Phase 4: User Story 2 - Adicionar usuário ao painel por e-mail (Priority: P1)

**Goal**: Bloco de adicionar usuário (e-mail + papel) dentro do modal "Usuários do painel",
reaproveitando exatamente o comportamento de convite por e-mail da issue #23.

**Independent Test**: Com o modal aberto, adicionar um e-mail já cadastrado com papel "Membro" e
verificar que a pessoa aparece na lista sem fechar o modal; repetir com e-mail sem conta e
verificar a confirmação de convite enviado, sem erro.

### Implementation for User Story 2

- [X] T007 [US2] Adicionar `adicionarUsuarioForm: FormGroup` (campos `email`, `permissao`,
      default `PainelPermissao.Membro`) e os signals `adicionandoUsuario`/`erroAdicionarUsuario`
      em `painel-detalhe.ts`, no mesmo padrão de `conviteForm`/`erroConvite` de `painel-criar.ts`
      (reaproveitar `PAPEIS_CONVITE` exportado de `painel-criar.ts` para as opções do select, ou
      extrair para um local compartilhado se `painel-criar.ts` não puder ser importado por
      `painel-detalhe.ts` sem acoplamento indevido — avaliar na implementação)
- [X] T008 [US2] Implementar `adicionarUsuario()` em `painel-detalhe.ts`: valida formato de e-mail
      (FR-005), bloqueia e-mail do próprio usuário logado comparando com
      `accountService.usuarioAtual?.email` (FR-006), bloqueia e-mail já presente em
      `painel()?.usuarios` (FR-007) — todas as validações antes de qualquer chamada de rede
- [X] T009 [US2] Em `adicionarUsuario()`, chamar `ConviteService.criarConvite(painel.id, { email,
      permissao, urlFrontend })` (mesmo `urlFrontend` = `${window.location.origin}/convites` já
      usado em `painel-criar.ts`); em caso de sucesso, recarregar o painel via
      `PainelService.obterPainel(id)` pra atualizar `painel()` com a lista real (research.md,
      Decisão 2 — não fazer append manual) (FR-004, FR-008)
- [X] T010 [US2] Exibir confirmação de "convite enviado" quando o e-mail adicionado não corresponder
      a nenhum usuário na lista recarregada (ou seja, quando a resposta implicar convite pendente
      em vez de associação direta), deixando claro que a pessoa ainda não é membro (FR-009)
- [X] T011 [US2] Tratar erro de `criarConvite`/`obterPainel` em `adicionarUsuario()`: exibir
      `erroAdicionarUsuario` com a `descricao` da API (mesmo padrão de tratamento de `Erro[]` já
      usado em `painel-detalhe.ts`), sem limpar o formulário, permitindo nova tentativa (FR-010)
- [X] T012 [US2] Adicionar o bloco de formulário (e-mail + select de papel + botão adicionar) no
      topo do modal "Usuários do painel" em `painel-detalhe.html`, reaproveitando a estrutura visual
      de `.invite-row`/`.field`/`.hint-note` já estilizada em `painel-criar.scss` (portar os
      seletores equivalentes para `painel-detalhe.scss` em vez de duplicar arquivo)
- [X] T013 [US2] Confirmar visualmente que nenhuma linha da lista de usuários (T004) ganhou
      controles de remover ou de papel editável — a lista deve continuar 100% somente leitura após
      este bloco ser adicionado (FR-011, FR-012)

**Checkpoint**: US1 e US2 completas — modal "Usuários do painel" funcional de ponta a ponta.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T014 [P] Confirmar foco visível (`:focus-visible`) e `aria-label` nos novos controles
      interativos (botão "Usuários", campo/select/botão de adicionar, botão fechar do modal) em
      `painel-detalhe.html`
- [X] T015 [P] Rodar `ng test` e confirmar que os specs existentes continuam passando sem alteração
      de comportamento fora do escopo desta feature
- [ ] T016 Executar manualmente os 5 cenários de
      `specs/002-gerenciar-usuarios-painel/quickstart.md` contra `api-dashfinras` local
- [X] T017 Confirmar que o fluxo de adicionar usuário na criação de painel (issue #23,
      `painel-criar`) continua funcionando sem alteração — regressão explícita do quickstart

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências
- **Foundational (Phase 2)**: Vazia — nada bloqueia as user stories
- **User Stories (Phase 3-4)**: US1 (T002-T006) pode ser completada e testada isoladamente (lista
  somente leitura); US2 (T007-T013) depende do modal de US1 já existir (T004) para ter onde
  colocar o formulário de adicionar, mas a lógica de validação/chamada (T007-T009) é independente
- **Polish (Phase 5)**: Depende de US1 e US2 completas

### Parallel Opportunities

- T014 e T015 (Polish) podem rodar em paralelo
- Dentro de US1, T002 (estado) e T006 (estilos) podem ser feitas em paralelo por pessoas
  diferentes, desde que T004 (template) sirva de ponto de integração

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1 — modal com lista somente leitura já entrega valor (visibilidade
   de quem tem acesso ao painel), mesmo sem a capacidade de adicionar
3. **PARAR e VALIDAR**: Cenário 1 do quickstart
4. Completar Phase 4: User Story 2 — fecha o ciclo "ver + adicionar"

### Incremental Delivery

1. Setup → nenhuma base a preparar
2. US1 → testar independentemente (lista visível, restrição de acesso por papel)
3. US2 → testar independentemente (adicionar por e-mail, validações, atualização da lista)
4. Cada story soma valor sem quebrar a anterior

## Notes

- Nenhuma tarefa de teste automatizado foi gerada (não solicitado no spec)
- Nenhum DTO/endpoint novo — toda a feature reaproveita `ConviteService`/`PainelService` já
  existentes (ver `contracts/usuarios-painel-api.md`)
- Remover usuário e alterar papel de membro existente permanecem fora de escopo — nenhuma tarefa
  aqui implementa isso, por design (ver `spec.md` › Assumptions e FR-011/FR-012)
- Commit após cada tarefa ou grupo lógico
