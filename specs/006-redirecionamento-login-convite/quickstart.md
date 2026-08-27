# Quickstart: Validar redirecionamento de login/cadastro ao responder convite

## Pré-requisitos

- `npm install`
- `.env` configurado (`cp .env.example .env`, preenchendo Supabase + `API_DASHFINRAS_URL`)
- `src/environments/environment.ts` / `environment.prod.ts` configurados (**nunca sobrescrever se
  já existirem** — copiar apenas se ausentes)
- Um convite pendente já criado via API/backend para um e-mail de teste (ver
  `specs/001-convite-usuario-email` para como um convite é originado)

## Rodando localmente

Login/logout e guards de rota exigem o BFF (não funcionam em `ng serve` puro):

```bash
npm run start:dev   # UI (hot reload) + BFF (auth/API) juntos, https://localhost:4300
```

## Cenários de validação (mapeados às User Stories da spec)

### US1 — Sem sessão ativa

1. Em uma janela anônima/sem cookie `df_session`, abra
   `https://localhost:4300/convites/<token-do-convite-pendente>`.
2. **Esperado**: redirecionamento para
   `/login?redirectUrl=%2Fconvites%2F<token>` (verificar na barra de endereço).
3. Faça login com uma conta já cadastrada (com perfil de aplicação completo).
4. **Esperado**: retorno automático para `/convites/<token>`, com os dados do convite e as ações
   Aprovar/Recusar visíveis.

### US1 (variação) — Criar conta nova a partir do convite

1. A partir da mesma tela de login redirecionada, escolha "criar conta".
2. **Esperado**: ao concluir o cadastro da conta, a navegação segue para
   `/completar-cadastro?redirectUrl=%2Fconvites%2F<token>` (não direto para o convite).

### US2 — Autenticado sem cadastro completo

1. Com uma sessão Supabase válida mas sem usuário de aplicação (`USER_NOT_FOUND` em
   `GET /api/account`), abra `/convites/<token>`.
2. **Esperado**: redirecionamento para `/completar-cadastro?redirectUrl=%2Fconvites%2F<token>`.
3. Preencha e envie o formulário de cadastro.
4. **Esperado**: retorno automático para `/convites/<token>`, com os dados do convite visíveis.

### US3 — Já autenticado e cadastrado (caminho feliz)

1. Com sessão válida e cadastro completo, abra `/convites/<token>` diretamente.
2. **Esperado**: nenhum redirecionamento; a tela do convite aparece imediatamente.
3. Clique em "Aprovar" (ou "Recusar").
4. **Esperado**: a tela reflete o resultado (confirmação de aprovação com link para o painel, ou
   confirmação de recusa), sem navegação para fora da página.

### Edge case — Token inválido/expirado sem sessão

1. Em janela anônima, abra `/convites/<token-invalido-ou-expirado>`.
2. **Esperado**: redirecionamento para login primeiro (igual ao US1); a mensagem de erro do
   convite (expirado/inválido) só aparece depois de concluir o login.

## Testes automatizados

```bash
npm test -- --run src/app/app-routing-module.spec.ts        # se existir; validar canActivate da rota de convite
npm test -- --run src/app/features/convite                  # specs do ConviteResponder
```

Verificar que os testes de `login.spec.ts` e `completar-cadastro.spec.ts` continuam passando sem
alteração (comportamento de `redirectUrl` reaproveitado, não modificado).
