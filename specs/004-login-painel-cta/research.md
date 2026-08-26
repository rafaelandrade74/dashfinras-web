# Phase 0 Research: CTA da página inicial reflete sessão ativa

## 1. Como refletir reativamente o estado de sessão na Landing, numa app zoneless

**Decision**: `LandingComponent` passa a manter um `signal<boolean | null>` (ex.: `sessaoConfirmada`, iniciando em `false`/estado "Entrar" por padrão, conforme decidido na clarificação) atualizado dentro de um `ngOnInit` que faz `await this.authService.waitUntilReady()` e então lê `authService.isAuthenticated`, escrevendo o resultado no signal. Os `getters` (`ctaLink`, `ctaLabel`, `navCtaLabel`) passam a ler `this.sessaoConfirmada()` em vez de `authService.isAuthenticated` diretamente.

**Rationale**: A aplicação roda zoneless (`docs/padroes-frontend.md`, `project_zoneless_signals` em memória) — atualizar um campo de classe comum dentro de um `await`/`.then()` não dispara novo change detection. Um `signal()` é a única forma padronizada no projeto de garantir que o template recalcule os getters/bindings após a resposta assíncrona de `waitUntilReady()`. Isso resolve diretamente o bug relatado: hoje a landing só reflete a sessão corretamente se algo mais disparar CD por acaso.

**Alternatives considered**:
- Expor a sessão do `AuthService` como um `signal` público (ex.: `authService.sessaoSignal`) em vez de manter estado local no componente — mais reutilizável para futuras telas públicas, mas amplia o escopo do serviço além do que a spec pede; fica registrado aqui como possível follow-up, não incluído neste fix para não introduzir uma refatoração de API pública sem necessidade imediata (apenas 2 componentes precisam disso hoje).
- Usar `AsyncPipe` com uma promise/observable direto no template — o projeto atualmente não expõe `isAuthenticated` como `Observable`, exigiria mudar a superfície pública do serviço; mais invasivo que o necessário.

## 2. Redirecionamento automático da tela de login quando já autenticado

**Decision**: `LoginComponent` ganha um `ngOnInit` que faz `await this.authService.waitUntilReady()`; se `isAuthenticated` for `true`, chama `this.router.navigateByUrl(this.redirectUrlSeguro)` — reaproveitando a leitura de `redirectUrl` já existente (`route.snapshot.queryParamMap.get('redirectUrl')`), mas passando por uma validação de URL interna antes de usar. Enquanto a verificação está em andamento, o formulário de login permanece oculto (ou não é interativo) por um estado local (`checandoSessao` signal) para não piscar campos de usuário/senha para um usuário que será redirecionado no instante seguinte.

**Rationale**: Atende FR-004/FR-004a/FR-005 e a User Story 2. Reaproveita o mesmo getter `redirectUrl` já usado por `entrar()`/`criarConta()`, mantendo consistência de comportamento (mesma regra de fallback para `/paineis`).

**Alternatives considered**:
- Fazer isso via um guard de rota (`CanActivate` em `/login`) em vez de lógica no componente — mais alinhado ao padrão de guards já usado no projeto (`auth.guard.ts`), porém um guard de "usuário autenticado NÃO pode ver esta rota" é um padrão diferente dos guards existentes (que protegem contra usuário NÃO autenticado). Foi descartado por ora para manter o escopo pequeno e localizado no componente que já tem toda a lógica de `redirectUrl`; pode ser promovido a guard reutilizável se uma segunda tela precisar do mesmo comportamento no futuro.

## 3. Validação de "URL interna" para prevenir open redirect

**Decision**: Criar uma função pura `isInternalRedirectUrl(url: string): boolean` que aceita apenas strings que comecem com uma única barra `/` e não com `//` nem `/\` (para evitar URLs protocol-relative que o navegador trataria como externas) e não contenham um esquema (`http:`, `https:`, etc.) embutido. Usada tanto no novo redirecionamento automático do login quanto, opcionalmente, para reforçar o uso já existente do `redirectUrl` em `entrar()`/`criarConta()` (fora de escopo estrito da spec, mas barato de aplicar no mesmo ponto de leitura para fechar a lacuna apontada na clarificação de segurança).

**Rationale**: A spec (FR-004a, clarificação de 2026-08-26) exige bloquear redirecionamento para domínios externos. Hoje nenhuma validação existe (`redirectUrl` é lido e usado cru). A validação mais simples e correta para Angular `Router.navigateByUrl` é garantir que o valor seja um path interno (`/algo`), já que `navigateByUrl` só navega dentro da mesma SPA de qualquer forma — mas um valor como `https://evil.com` ou `//evil.com` passado a `navigateByUrl` pode ser interpretado de formas inesperadas dependendo da versão do Router, então a validação é aplicada antes, na leitura do parâmetro.

**Alternatives considered**:
- Usar `URL` do navegador para parsear e comparar `origin` — mais robusto para URLs absolutas, mas complexo demais para o caso de uso (o app só gera `redirectUrl` como paths relativos internamente); a checagem de prefixo cobre 100% dos casos legítimos gerados pelo próprio app (`auth.guard.ts`, `account.guard.ts`, `convite-responder.ts` sempre geram `encodeURIComponent(state.url)` ou `router.url`, que são sempre paths relativos).

## 4. Impacto em `AuthService`

**Decision**: Nenhuma mudança de API pública obrigatória em `auth.service.ts` — `waitUntilReady()` e `isAuthenticated` já são suficientes como estão. A reatividade fica encapsulada nos componentes (via `signal` local), não no serviço.

**Rationale**: Mantém o escopo da mudança mínimo e localizado, evitando alterar um serviço central usado por guards e outros componentes sem necessidade comprovada pela spec.

**Alternatives considered**: ver alternativa registrada no item 1 (expor um signal público no serviço) — descartada pelo mesmo motivo de escopo.
