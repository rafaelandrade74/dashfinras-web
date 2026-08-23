# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for **DashFinRas** (personal/business finance management), built with Angular using
NgModules (no standalone components). Consumes the `api-dashfinras` (.NET) API, with authentication
via Supabase Auth (email/password). Commit messages and UI strings are in Portuguese.

## Commands

```bash
npm install
cp src/environments/environment.example.ts src/environments/environment.ts             # fill in real Supabase url/anonKey
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts   # same, for prod
npm start        # ng serve --host 0.0.0.0 --ssl --ssl-cert ssl/dev-server.crt --ssl-key ssl/dev-server.key
npm run build     # ng build (production config by default)
npm run watch     # ng build --watch --configuration development
npm test          # ng test (vitest via @angular/build:unit-test)
```

- Dev server runs over HTTPS (self-signed cert in `ssl/`, gitignored). It binds to `0.0.0.0`.
- There is no separate lint script configured; formatting is enforced via Prettier (`.prettierrc`:
  100-char width, single quotes, Angular parser for `.html`).
- Angular CLI schematics default to `standalone: false` for components/directives/pipes
  (`angular.json`) — new pieces should follow the existing NgModule pattern, not standalone APIs.

## Architecture

### Module/routing structure

`AppRoutingModule` (`src/app/app-routing-module.ts`) lazy-loads three feature modules by path:

- `/login` → `AuthModule` — email/password login, sign-up, and password-recovery screen, no guards.
- `/completar-cadastro` → `CadastroModule`, guarded by `authGuard` only.
- `/paineis` (default redirect target) → `PainelModule`, guarded by `authGuard` then `accountGuard`.

Route guard order matters: `authGuard` (`core/guards/auth.guard.ts`) awaits `AuthService`'s Supabase
session check and redirects to `/login?redirectUrl=...` if unauthenticated. `accountGuard`
(`core/guards/account.guard.ts`) then calls `AccountService.obterUsuario()` against the API; if the
API returns a `USER_NOT_FOUND` error code, it redirects to `/completar-cadastro?redirectUrl=...`
instead of failing. This two-step guard is how the app forces a Supabase-authenticated user to
finish registering an application-side user profile before reaching the dashboards. Sign-up
(`Login.criarConta()`) logs the user in automatically and sends them straight to
`/completar-cadastro`, skipping the guard's redirect round-trip.

### Auth wiring

`AuthService` (`core/services/auth.service.ts`) wraps a Supabase client (`@supabase/supabase-js`,
built from `environment.supabase.{url,anonKey}`) and exposes `login`/`signUp`/`logout`/
`resetPassword` plus `isAuthenticated`/`token`/`nomeUsuario` derived from a cached session
(`BehaviorSubject`, kept in sync via `onAuthStateChange`). `waitUntilReady()` resolves once the
initial `getSession()` call completes — `authGuard` awaits it before checking `isAuthenticated`. An
HTTP interceptor (`bearer-token.interceptor.ts`) attaches `Authorization: Bearer <token>` only to
requests whose URL matches `environment.apiUrl` — new HttpClient calls to the API must go through
`environment.apiUrl` for the token to be attached automatically.

### API layer

`core/services/*.service.ts` are thin `HttpClient` wrappers over `${environment.apiUrl}/<resource>`,
returning typed `Observable`s. `core/models/*.model.ts` mirror the API's request/response DTOs
(naming follows the API: `RequestX...Dto`, `ResponseX...Dto`, `GetXDto`, `AddXDto`). API error
payloads are arrays of `Erro { codigo, descricao }`; callers match on `codigo` (e.g.
`USER_NOT_FOUND` in `accountGuard`) and surface `descricao` to the user.

### Environments

`src/environments/environment.ts` (dev) and `environment.prod.ts` (prod) hold `apiUrl` and
`supabase.{url,anonKey}`. Both files are **gitignored** because they carry real Supabase project
credentials — only `environment.example.ts` / `environment.prod.example.ts` (with placeholder
values) are committed; copy them locally per the Commands section above. Note: the Supabase anon
key is meant to ship in the client bundle (data access is enforced by Postgres RLS policies, not by
keeping the anon key secret) — it's gitignored here for environment hygiene/rotation, not because
it's a true secret. The `service_role` key must never be used in this app. There's no environment
file replacement wired in `angular.json` — `ng build` (which defaults to the `production`
configuration) imports `environment.ts` directly, so check which file is actually being
edited/used when changing API or Supabase settings for a given target.

### Related repo

The API (`api-dashfinras`, .NET) lives as a sibling directory and has its own CLAUDE.md.

## Frontend patterns

See [`docs/padroes-frontend.md`](docs/padroes-frontend.md) for recurring implementation patterns
not obvious from a single component — most importantly: **this app runs without zone.js
(zoneless)**, so any component state updated inside a Promise `.then()` or a manual `.subscribe()`
callback must be a `signal()`, not a plain class field, or the view won't reliably re-render.
