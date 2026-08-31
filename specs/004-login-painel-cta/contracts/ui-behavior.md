# Contrato de comportamento de UI: Landing CTA e redirecionamento do Login

Este feature não expõe API/endpoint novo — o "contrato" aqui é o comportamento observável dos dois componentes de UI afetados, para orientar os testes automatizados (`.spec.ts`).

## `LandingComponent` (`src/app/features/home/landing/landing.ts`)

| Estado da sessão (`AuthService`) | `navCtaLabel` | `ctaLabel` | `ctaLink` |
|---|---|---|---|
| Verificação pendente (`waitUntilReady()` ainda não resolveu) | `"Entrar"` | `"Criar meu painel"` | `/login` |
| Resolvida, `isAuthenticated === false` | `"Entrar"` | `"Criar meu painel"` | `/login` |
| Resolvida, `isAuthenticated === true` | `"Meus painéis"` | `"Ir para meus painéis"` | `/paineis` |

Regras adicionais:
- O valor nunca deve "piscar" de `"Meus painéis"` de volta para `"Entrar"` depois de confirmado autenticado (a menos que uma nova verificação real diga que a sessão não é mais válida).
- Nenhuma chamada de rede adicional é feita — reaproveita o `waitUntilReady()` já dado pelo boot.

## `LoginComponent` (`src/app/features/auth/login/login.ts`)

Comportamento no `ngOnInit`, após `waitUntilReady()` resolver:

| `isAuthenticated` | `redirectUrl` (query string) | Ação |
|---|---|---|
| `false` | (qualquer) | Exibe o formulário de login normalmente (comportamento atual, sem mudança) |
| `true` | ausente | `router.navigateByUrl('/paineis')` |
| `true` | presente e interno (`isInternalRedirectUrl(...) === true`), ex. `/paineis/123` | `router.navigateByUrl(redirectUrl)` |
| `true` | presente e **externo** (ex. `https://evil.com`, `//evil.com`) | `router.navigateByUrl('/paineis')` (ignora o valor malicioso) |

Regras adicionais:
- Enquanto `waitUntilReady()` está pendente, o formulário não deve ser exibido de forma interativa/visível de modo a permitir que um usuário autenticado digite credenciais desnecessariamente antes do redirecionamento ocorrer (ver `checandoSessao`).
- O redirecionamento automático deve ocorrer antes de qualquer interação do usuário com os campos — não depende de submit.
- Este comportamento não deve reintroduzir chamadas a `account/login`/`account/logout` no BFF (contrato já removido, ver `CLAUDE.md`).

## Função utilitária: `isInternalRedirectUrl`

```
isInternalRedirectUrl(url) → boolean
```

| Entrada | Saída |
|---|---|
| `null` / `undefined` / `''` | `false` |
| `/paineis` | `true` |
| `/paineis/123?x=1` | `true` |
| `//evil.com` | `false` |
| `https://evil.com` | `false` |
| `javascript:alert(1)` | `false` |
| `/\evil.com` | `false` |
