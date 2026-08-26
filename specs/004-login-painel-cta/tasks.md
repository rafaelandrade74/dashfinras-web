---

description: "Task list template for feature implementation"
---

# Tasks: CTA da página inicial reflete sessão ativa

**Input**: Design documents from `/specs/004-login-painel-cta/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui-behavior.md](./contracts/ui-behavior.md), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — o `quickstart.md` já define casos automatizados esperados em `landing.spec.ts`/`login.spec.ts`, e o padrão do repositório mantém specs ao lado de cada componente/serviço.

**Organization**: Tasks agrupadas por user story (ambas P1, independentes entre si) para permitir implementação e teste isolados.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1 = CTA da home reflete sessão; US2 = redirecionamento automático do login
- Caminhos de arquivo exatos incluídos em cada descrição

## Path Conventions

Projeto Angular único (NgModules): `src/app/features/...`, specs ao lado de cada arquivo (`*.spec.ts`), conforme `plan.md` → Project Structure.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar ambiente pronto para desenvolver/testar a feature (sem infraestrutura nova a criar).

- [X] T001 Confirmar branch `004-login-painel-cta` criada a partir da `develop` atualizada e ambiente local configurado (`.env`, `src/environments/environment*.ts`) para rodar `npm run start:dev` conforme `CLAUDE.md`

**Checkpoint**: Nenhuma infraestrutura nova é necessária; siga direto para a Fase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nenhum pré-requisito bloqueia as duas user stories entre si — `LandingComponent` (US1) e `LoginComponent` (US2) usam mecanismos independentes (`waitUntilReady()`/`isAuthenticated` já existem em `AuthService`, sem mudança de API). Esta fase fica vazia por design; ambas as stories podem começar em paralelo.

**Checkpoint**: Sem bloqueios — user stories podem ser implementadas em paralelo ou em qualquer ordem.

---

## Phase 3: User Story 1 - Botão da página inicial reflete a sessão (Priority: P1) 🎯 MVP

**Goal**: O botão de CTA da landing page (`nav`, hero e rodapé) mostra "Meus painéis"/`/paineis` quando há sessão válida e "Entrar"/`/login` (ou equivalentes de landing) quando não há, refletindo corretamente mesmo após o fetch assíncrono de sessão do boot, numa app zoneless.

**Independent Test**: Fazer login, navegar para `/`, e verificar que o botão de navegação muda para "Meus painéis" (sem precisar de reload manual) e leva direto a `/paineis`. Em aba anônima, verificar que continua mostrando "Entrar" e levando a `/login`. Ver [contracts/ui-behavior.md § LandingComponent](./contracts/ui-behavior.md#landingcomponent-srcappfeatureshomelandinglandingts) e [quickstart.md Cenários 1-2](./quickstart.md#cenário-1--usuário-não-autenticado-vê-entrar-na-home).

### Tests for User Story 1

> Escrever estes testes primeiro e confirmar que falham antes de implementar.

- [X] T002 [P] [US1] Adicionar em `src/app/features/home/landing/landing.spec.ts` um caso que verifica que, antes de `waitUntilReady()` resolver, `navCtaLabel`/`ctaLabel`/`ctaLink` retornam os valores do estado não-autenticado ("Entrar"/"Criar meu painel"/`/login`)
- [X] T003 [P] [US1] Adicionar em `src/app/features/home/landing/landing.spec.ts` um caso que, após `waitUntilReady()` resolver com `isAuthenticated === true`, confirma que `navCtaLabel === 'Meus painéis'`, `ctaLabel === 'Ir para meus painéis'` e `ctaLink === '/paineis'` (usando `fixture.detectChanges()` após o `await`, conforme padrão zoneless do projeto)
- [X] T004 [P] [US1] Adicionar em `src/app/features/home/landing/landing.spec.ts` um caso que confirma que, com `isAuthenticated === false` após `waitUntilReady()`, os valores permanecem "Entrar"/"Criar meu painel"/`/login`

### Implementation for User Story 1

- [X] T005 [US1] Em `src/app/features/home/landing/landing.ts`, adicionar um `signal<boolean>` privado (ex.: `sessaoConfirmada`) inicializado em `false`, e um `ngOnInit` que faz `await this.authService.waitUntilReady()` e então chama `this.sessaoConfirmada.set(this.authService.isAuthenticated)` (depende de T002-T004 existirem e falharem antes desta task)
- [X] T006 [US1] Em `src/app/features/home/landing/landing.ts`, atualizar os getters `ctaLink`, `ctaLabel` e `navCtaLabel` para ler `this.sessaoConfirmada()` no lugar de `this.authService.isAuthenticated` diretamente (depende de T005)
- [X] T007 [US1] Rodar `npm test -- --run src/app/features/home/landing` e confirmar que T002-T004 passam (depende de T005, T006)

**Checkpoint**: Neste ponto, a User Story 1 deve estar completa e testável de forma independente — CTA da home reflete corretamente a sessão.

---

## Phase 4: User Story 2 - Acesso direto à página de login com sessão ativa (Priority: P1)

**Goal**: Ao acessar `/login` diretamente já autenticado, o usuário é redirecionado automaticamente (para `redirectUrl` se for um caminho interno válido, senão para `/paineis`), sem nunca ver o formulário de login, e sem risco de redirecionamento para um domínio externo.

**Independent Test**: Estando logado, acessar `/login` diretamente (com e sem `redirectUrl` interno, e com `redirectUrl` externo) e confirmar o redirecionamento automático correto em cada caso, sem exibir o formulário. Em aba anônima, confirmar que o formulário continua aparecendo normalmente. Ver [contracts/ui-behavior.md § LoginComponent](./contracts/ui-behavior.md#logincomponent-srcappfeaturesauthloginlogints) e [quickstart.md Cenários 3-5](./quickstart.md#cenário-3--acesso-direto-a-login-já-autenticado-sem-redirecturl).

### Tests for User Story 2

> Escrever estes testes primeiro e confirmar que falham antes de implementar.

- [X] T008 [P] [US2] Criar `src/app/features/auth/login/internal-url.spec.ts` (ou local equivalente ao helper) com casos de `isInternalRedirectUrl` cobrindo a tabela do contrato: `null`/`undefined`/`''` → `false`; `/paineis`, `/paineis/123?x=1` → `true`; `//evil.com`, `https://evil.com`, `javascript:alert(1)`, `/\evil.com` → `false`
- [X] T009 [P] [US2] Adicionar em `src/app/features/auth/login/login.spec.ts` um caso que confirma que, com `isAuthenticated === true` e sem `redirectUrl` na query string, `ngOnInit` chama `router.navigateByUrl('/paineis')` e o formulário não fica visível/interativo
- [X] T010 [P] [US2] Adicionar em `src/app/features/auth/login/login.spec.ts` um caso que confirma que, com `isAuthenticated === true` e `redirectUrl=/paineis/123` (interno), `ngOnInit` chama `router.navigateByUrl('/paineis/123')`
- [X] T011 [P] [US2] Adicionar em `src/app/features/auth/login/login.spec.ts` um caso que confirma que, com `isAuthenticated === true` e `redirectUrl=https://evil.com` (externo), `ngOnInit` chama `router.navigateByUrl('/paineis')` (não o valor externo)
- [X] T012 [P] [US2] Adicionar em `src/app/features/auth/login/login.spec.ts` um caso que confirma que, com `isAuthenticated === false`, o formulário de login continua sendo exibido normalmente (sem redirecionamento) — cobre a regressão do Cenário 5

### Implementation for User Story 2

- [X] T013 [US2] Criar a função pura `isInternalRedirectUrl(url: string | null | undefined): boolean` (arquivo `src/app/features/auth/login/internal-url.ts`, reaproveitável por `login.ts`), aplicando a regra do contrato (começa com uma única `/`, não começa com `//` nem `/\`, sem `:` antes da primeira `/`) (depende de T008 existir e falhar antes)
- [X] T014 [US2] Em `src/app/features/auth/login/login.ts`, adicionar um `signal<boolean>` privado (ex.: `checandoSessao`) inicializado em `true`, e um `ngOnInit` que faz `await this.authService.waitUntilReady()`; ao final, define `checandoSessao` como `false` (depende de T013)
- [X] T015 [US2] Em `src/app/features/auth/login/login.ts`, dentro do mesmo `ngOnInit`, se `this.authService.isAuthenticated` for `true`, calcular o destino usando `isInternalRedirectUrl` sobre `this.redirectUrl` (`/paineis` como fallback quando ausente ou externo) e chamar `this.router.navigateByUrl(destino)` antes de liberar `checandoSessao` (depende de T014)
- [X] T016 [US2] Em `src/app/features/auth/login/login.html`, condicionar a exibição/interatividade do formulário a `!checandoSessao()` (ex.: `*ngIf` ou desabilitar campos), evitando piscar os campos de usuário/senha para quem será redirecionado (depende de T014)
- [X] T017 [US2] Rodar `npm test -- --run src/app/features/auth/login` e confirmar que T008-T012 passam (depende de T013-T016)

**Checkpoint**: Neste ponto, ambas as User Stories devem funcionar de forma independente — home reflete sessão e login redireciona automaticamente quem já está autenticado.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validação manual fim-a-fim e fechamento de lacunas de segurança relacionadas identificadas na pesquisa, sem expandir o escopo da spec.

- [X] T018 Executar manualmente os 5 cenários de [quickstart.md](./quickstart.md) contra `npm run start:dev`, cobrindo home (autenticado/não autenticado) e login (com/sem `redirectUrl` interno/externo, autenticado/não autenticado)
- [X] T019 [P] Rodar a suíte completa `npm test` e confirmar que nenhum teste existente quebrou (`login.spec.ts`, `auth.guard.spec.ts`, `account.guard.spec.ts`, etc.)
- [X] T020 [P] (Opcional, fora do escopo estrito da spec mas recomendado por `research.md` §3) Em `src/app/features/auth/login/login.ts`, aplicar `isInternalRedirectUrl` também na leitura de `redirectUrl` usada por `entrar()`/`criarConta()`, fechando a mesma lacuna de open-redirect nesses fluxos existentes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Vazia — não bloqueia nada
- **User Stories (Phase 3 e 4)**: Ambas dependem apenas do Setup; são totalmente independentes entre si (arquivos diferentes: `landing.ts`/`.html` vs. `login.ts`/`.html`/`internal-url.ts`) e podem ser feitas em paralelo ou em qualquer ordem
- **Polish (Phase 5)**: Depende da conclusão das Fases 3 e 4

### Dentro de cada User Story

- Testes (T002-T004, T008-T012) devem ser escritos e falhar antes da implementação correspondente
- US1: T005 → T006 → T007
- US2: T013 depende de T008; T014 depende de T013; T015 depende de T014; T016 depende de T014; T017 depende de T013-T016

### Parallel Opportunities

- T002, T003, T004 (testes de US1) podem rodar em paralelo entre si
- T008, T009, T010, T011, T012 (testes de US2) podem rodar em paralelo entre si
- Toda a Fase 3 (US1) pode ser feita em paralelo com toda a Fase 4 (US2) por serem arquivos completamente distintos
- T019 e T020 (Polish) podem rodar em paralelo

---

## Parallel Example: User Story 1 vs. User Story 2

```bash
# Uma pessoa/thread pode tocar toda a US1 enquanto outra toca toda a US2, em paralelo:
# US1: T002, T003, T004 → T005 → T006 → T007  (arquivos: landing.ts, landing.html, landing.spec.ts)
# US2: T008..T012 → T013 → T014 → T015, T016 → T017  (arquivos: login.ts, login.html, internal-url.ts, login.spec.ts, internal-url.spec.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Fase 1: Setup
2. Fase 2 (Foundational) está vazia — pular
3. Completar Fase 3: User Story 1
4. **PARAR e VALIDAR**: testar a home isoladamente (Cenários 1-2 do quickstart)
5. Esse já é um MVP visível do bug relatado (texto do botão), mesmo sem a Fase 4

### Incremental Delivery

1. Setup → Fundação (vazia) → pronto para começar
2. Adicionar US1 → testar isoladamente → já corrige a parte "botão mostra Entrar mesmo logado"
3. Adicionar US2 → testar isoladamente → corrige a parte "login não redireciona quem já está logado"
4. Polish → validação manual completa + suíte de testes + hardening opcional (T020)

## Notes

- [P] tasks = arquivos diferentes, sem dependência entre si
- Ambas as user stories são P1 no spec — não há uma "MVP mínima" que exclua a outra sem deixar o bug relatado pela metade; a ordem sugerida (US1 primeiro) é apenas porque é a mudança mais simples e visível
- Confirmar que os testes falham antes de implementar (T002-T004 antes de T005-T006; T008-T012 antes de T013-T016)
- Fazer commit após cada task ou grupo lógico
