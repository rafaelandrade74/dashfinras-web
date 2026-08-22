# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for **DashFinRas** (personal/business finance management), built with Angular using
NgModules (no standalone components). Consumes the `api-dashfinras` (.NET) API, with authentication
via Keycloak (OAuth2/OIDC). Commit messages and UI strings are in Portuguese.

## Commands

```bash
npm install
npm start        # ng serve --host 0.0.0.0 --ssl --ssl-cert ssl/dev-server.crt --ssl-key ssl/dev-server.key
npm run build     # ng build (production config by default)
npm run watch     # ng build --watch --configuration development
npm test          # ng test (vitest via @angular/build:unit-test)
```

- Dev server runs over HTTPS (self-signed cert in `ssl/`, gitignored) because Keycloak requires a
  secure origin. It binds to `0.0.0.0`.
- There is no separate lint script configured; formatting is enforced via Prettier (`.prettierrc`:
  100-char width, single quotes, Angular parser for `.html`).
- Angular CLI schematics default to `standalone: false` for components/directives/pipes
  (`angular.json`) — new pieces should follow the existing NgModule pattern, not standalone APIs.

## Architecture

### Module/routing structure

`AppRoutingModule` (`src/app/app-routing-module.ts`) lazy-loads three feature modules by path:

- `/login` → `AuthModule` — Keycloak-driven login screen, no guards.
- `/completar-cadastro` → `CadastroModule`, guarded by `authGuard` only.
- `/paineis` (default redirect target) → `PainelModule`, guarded by `authGuard` then `accountGuard`.

Route guard order matters: `authGuard` (from `keycloak-angular`) checks Keycloak authentication and
redirects to `/login?redirectUrl=...` if unauthenticated. `accountGuard`
(`core/guards/account.guard.ts`) then calls `AccountService.obterUsuario()` against the API; if the
API returns a `USER_NOT_FOUND` error code, it redirects to `/completar-cadastro?redirectUrl=...`
instead of failing. This two-step guard is how the app forces a Keycloak-authenticated user to
finish registering an application-side user profile before reaching the dashboards.

### Auth wiring

Keycloak is configured in `app-module.ts` via `provideKeycloak(...)`, reading `environment.keycloak`.
`onLoad: 'check-sso'` with a `silentCheckSsoRedirectUri` pointing at
`public/assets/silent-check-sso.html` avoids a full-page redirect on load. An HTTP interceptor
(`includeBearerTokenInterceptor`) attaches the bearer token only to requests whose URL matches
`environment.apiUrl` (built via `createInterceptorCondition`) — new HttpClient calls to the API must
go through `environment.apiUrl` for the token to be attached automatically. `AuthService`
(`core/services/auth.service.ts`) wraps `Keycloak` (the injectable from `keycloak-js`) for
login/logout/`isAuthenticated`/`token`/`nomeUsuario`.

### API layer

`core/services/*.service.ts` are thin `HttpClient` wrappers over `${environment.apiUrl}/<resource>`,
returning typed `Observable`s. `core/models/*.model.ts` mirror the API's request/response DTOs
(naming follows the API: `RequestX...Dto`, `ResponseX...Dto`, `GetXDto`, `AddXDto`). API error
payloads are arrays of `Erro { codigo, descricao }`; callers match on `codigo` (e.g.
`USER_NOT_FOUND` in `accountGuard`) and surface `descricao` to the user.

### Environments

`src/environments/environment.ts` (dev) and `environment.prod.ts` (prod) hold `apiUrl` and
`keycloak.{url,realm,clientId}`. Dev points at a LAN API host and the `rasfin` Keycloak realm; prod
uses a relative `/api` path and the `dashfinras` realm/client. There's no environment file
replacement wired in `angular.json` — `ng build` (which defaults to the `production` configuration)
imports `environment.ts` directly, so check which file is actually being edited/used when changing
API or Keycloak settings for a given target.

### Related repo

The API (`api-dashfinras`, .NET) lives as a sibling directory and has its own CLAUDE.md.
