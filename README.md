# dashfinras-web

Frontend do **DashFinRas** — gerenciamento de finanças pessoais e empresariais.

Consome a API [`api-dashfinras`](../dashfinras) (.NET, autenticação via Keycloak).

## Stack

- **Angular** (NgModules, sem standalone components)
- **Angular Material** (tema M3) para UI
- **keycloak-angular** / **keycloak-js** para autenticação (OAuth2/OIDC)
- SCSS

## Estrutura

```
src/app/
 ├── core/               # services HTTP, models, guards e autenticação compartilhados
 │   ├── models/         # interfaces alinhadas aos DTOs da API
 │   ├── guards/          # authGuard (protege rotas autenticadas)
 │   └── services/       # AccountService, PainelService, AuthService
 └── features/
     ├── auth/           # tela de login (redireciona para o Keycloak)
     └── painel/         # módulo lazy-loaded de painéis (CRUD)
```

## Configuração

Endpoints da API e do Keycloak ficam em `src/environments/environment.ts` (dev) e
`environment.prod.ts` (produção). Ajuste `apiUrl` e `keycloak.{url,realm,clientId}`
conforme o ambiente.

## Desenvolvimento

```bash
npm install
npm start        # ng serve
npm run build     # build de produção
npm test          # testes unitários
```

## Status

Estrutura de pastas, roteamento, integração HTTP com a API, autenticação Keycloak
(tela de login + guard de rotas) e listagem inicial de painéis configuradas.
CRUD completo de painéis ainda será implementado.
