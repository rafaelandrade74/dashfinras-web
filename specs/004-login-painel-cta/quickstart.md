# Quickstart: validar CTA da home e redirecionamento do login

Pré-requisitos: `.env` e `src/environments/environment*.ts` já configurados (ver `CLAUDE.md`), pois é preciso auth real (BFF) para validar sessão.

```bash
npm run start:dev   # UI hot-reload + BFF de auth juntos (https://localhost:4300 ou porta configurada)
```

## Cenário 1 — Usuário não autenticado vê "Entrar" na home

1. Em uma aba anônima/sem cookie `df_session`, acesse `/`.
2. Verifique que o botão de navegação mostra **"Entrar"** e aponta para `/login`.
3. Clique nele → deve exibir o formulário de login normalmente.

## Cenário 2 — Usuário autenticado vê "Meus painéis" na home

1. Faça login normalmente (via `/login`) com um usuário válido.
2. Navegue para `/` (home pública).
3. Verifique que o botão de navegação mostra **"Meus painéis"** (não "Entrar"), sem precisar recarregar a página duas vezes.
4. Clique nele → deve ir direto para `/paineis`, sem passar pelo formulário de login.

Ver contrato de estados em [contracts/ui-behavior.md](./contracts/ui-behavior.md#landingcomponent-srcappfeatureshomelandinglandingts).

## Cenário 3 — Acesso direto a `/login` já autenticado (sem `redirectUrl`)

1. Estando já logado (cookie `df_session` válido), digite `/login` diretamente na barra de endereço.
2. Verifique que **não** aparece o formulário de login — o navegador é redirecionado automaticamente para `/paineis` (ou `/completar-cadastro` se o cadastro do usuário ainda não estiver completo).

## Cenário 4 — Acesso direto a `/login?redirectUrl=...` já autenticado

1. Estando já logado, acesse `/login?redirectUrl=%2Fpaineis%2F123` (path interno).
2. Verifique redirecionamento automático para `/paineis/123`.
3. Repita com `/login?redirectUrl=https%3A%2F%2Fexample.com` (URL externa).
4. Verifique que o redirecionamento vai para `/paineis` (destino padrão), **nunca** para `example.com`.

## Cenário 5 — Usuário não autenticado em `/login`

1. Em aba anônima, acesse `/login` (com ou sem `redirectUrl`).
2. Verifique que o formulário de login é exibido normalmente, sem redirecionamento algum (regressão a evitar).

## Testes automatizados

```bash
npm test -- --run src/app/features/home/landing
npm test -- --run src/app/features/auth/login
```

Casos que devem existir em `landing.spec.ts` e `login.spec.ts` (ver [contracts/ui-behavior.md](./contracts/ui-behavior.md)):
- Estado "verificação pendente" mostra o padrão não-autenticado.
- Transição para autenticado após `waitUntilReady()` resolver atualiza o template (checar via `fixture.detectChanges()` após o `await`, dado o app zoneless).
- `isInternalRedirectUrl` com casos de tabela do contrato (interno vs. externo vs. protocol-relative vs. `javascript:`).
