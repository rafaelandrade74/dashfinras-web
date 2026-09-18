# Deploy em produção

## Checklist antes de publicar

- [ ] `docker build -t dashfinras-web .` (ver [`Dockerfile`](../Dockerfile)) — SPA + BFF num único
      processo Node, uma porta só (`4300` por padrão).
- [ ] Env vars reais setadas no container/host (nunca via `.env` versionado): `SUPABASE_URL`,
      `SUPABASE_ANON_KEY`, `API_DASHFINRAS_URL`, `SESSION_COOKIE_SECRET` (32+ caracteres — gere
      com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Sem elas o
      processo recusa subir (`validateRequiredEnv()` em `src/server.ts`).
- [ ] **`BEHIND_PROXY=true`** — ver seção abaixo. **Fácil de esquecer porque sem essa variável o
      app sobe normalmente (não dá erro nenhum), só que sem forçar HTTPS** — o tipo de omissão que
      não aparece em teste manual rápido, só quando alguém acessar via `http://` de verdade.
- [ ] Cloudflare Tunnel (`cloudflared`) configurado pra injetar `X-Forwarded-Proto: https` nas
      requisições que encaminha pro origin — **não é automático**, ver seção abaixo.
- [ ] **`ALLOWED_HOSTS`** setado com o(s) domínio(s) reais de produção (ex.:
      `ALLOWED_HOSTS=app.exemplo.com`). Atrás de proxy (`BEHIND_PROXY=true`) não há mais um
      fallback permissivo — sem essa variável, o `AngularNodeAppEngine` rejeita todo mundo (ver
      `.env.example`).
- [ ] Node só acessível pelo túnel (bind em `localhost`/rede interna) — nunca exposto direto na
      internet com uma porta pública, ver "Por que isso importa" abaixo.

## `BEHIND_PROXY` — por que existe e quando setar

O cookie de sessão (`df_session`) é `Secure` — só viaja em HTTPS. Sem forçar HTTPS de ponta a
ponta, o *POST* de login (com a senha) ainda iria em texto claro até chegar nessa parte, se
alguém acessasse via `http://`.

`BEHIND_PROXY=true` (`src/server.ts` + `src/server/force-https.ts`) ativa:
- `app.set('trust proxy', 1)` — Express passa a confiar no header `X-Forwarded-Proto` do proxy
  pra saber se a conexão original era HTTPS (o Node em si só fala HTTP com o proxy).
- Redirect 301 pra `https://` em qualquer requisição que não chegue marcada como HTTPS.
- Header `Strict-Transport-Security` nas respostas que já vieram como HTTPS.
- `trustProxyHeaders` no `AngularNodeAppEngine`, pra ele também confiar nesses headers.

**Sem `BEHIND_PROXY=true`**: HTTP puro, sem redirect — certo pra testar o container isolado local,
errado pra produção atrás de um proxy real (a sessão fica sem a garantia de HTTPS).

**Com `BEHIND_PROXY=true` mas sem um proxy de verdade na frente mandando o header**: toda
requisição direta ao Node vira um redirect pra um `https://` que ninguém está escutando — trava
no navegador. Isso é esperado, não é bug: o modo só faz sentido com o proxy real configurado (ver
abaixo).

## Cloudflare Tunnel (`cloudflared`)

Diferente da maioria dos reverse proxies, o **`cloudflared` não adiciona `X-Forwarded-Proto`
automaticamente** ao encaminhar pro origin — é uma lacuna conhecida da ferramenta (ver
[cloudflare/cloudflared#1245](https://github.com/cloudflare/cloudflared/issues/1245)). Se você só
apontar o ingress pra `http://localhost:4300` sem mais nada, o Node nunca vai ver o header e
`BEHIND_PROXY=true` vai redirecionar (ou recusar) todo mundo — mesmo o tráfego legítimo vindo do
túnel.

**Correção**: injetar o header manualmente no `config.yml` do túnel, via `originRequest.headers`:

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: seu-dominio.com
    service: http://localhost:4300
    originRequest:
      headers:
        X-Forwarded-Proto: "https"
  - service: http_status:404
```

Isso é seguro porque o `cloudflared` está injetando o header ele mesmo (não repassando um valor
que o cliente mandou) — o valor sempre será `"https"` pra tráfego que passou pelo túnel.

## Por que o Node não pode ficar exposto direto na internet

O redirect/HSTS só protege quem passa pelo proxy. Se o processo Node também estiver acessível
direto (porta pública, sem o túnel no meio), qualquer um pode:
1. Bater direto nele em `http://` — nesse caso ainda tem o redirect (ok), **mas**
2. Mandar `X-Forwarded-Proto: https` manualmente na própria requisição, direto pro Node, e o
   redirect nunca dispara — o `trust proxy` faz o Express confiar em qualquer remetente que use
   esse header, não só no `cloudflared`.

Com o Cloudflare Tunnel isso já é resolvido por natureza (o túnel é *outbound-only*: o Node não
precisa de porta pública nenhuma pra funcionar, `cloudflared` conecta nele localmente) — só não
exponha a mesma porta publicamente "por garantia" ou pra debug.
