# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for **DashFinRas** (personal/business finance management), built with Angular using
NgModules (no standalone components). Consumes the `api-dashfinras` (.NET) API. Authentication
(Supabase Auth, email/password) is brokered by this app's own Node server (BFF) — see "Auth
wiring" below. Commit messages and UI strings are in Portuguese.

## Branching

`develop` is the integration branch — **all PRs target `develop`, never `main`** (`main` still
exists as GitHub's default branch/what gets deployed, but day-to-day work doesn't land there
directly). Branch new work off latest `develop`, not `main`:

```bash
git checkout develop && git pull
git checkout -b feature/<issue-number>-<slug>   # or fix/<issue-number>-<slug>
```

## Commands

```bash
npm install
cp src/environments/environment.example.ts src/environments/environment.ts             # fill in real apiUrl if not '/api'
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts   # same, for prod
cp .env.example .env   # fill in SUPABASE_URL/SUPABASE_ANON_KEY/API_DASHFINRAS_URL/SESSION_COOKIE_SECRET
npm start        # ng serve --host 0.0.0.0 --ssl ... — UI hot-reload only, /api/auth/* NOT available
npm run start:ssr # builds + runs the Node/Express BFF (https://localhost:4300) — full auth flow
npm run start:dev # both of the above together (concurrently), for UI hot-reload + working auth
npm run build     # ng build (production config by default) — emits both browser and server bundles
npm run watch     # ng build --watch --configuration development
npm test          # ng test (vitest via @angular/build:unit-test)
```

- `npm start` (`ng serve`) is CSR-only dev — no `/api/*` routes exist in that mode, since those are
  Express routes registered in `src/server.ts`. Use `start:ssr` or `start:dev` to test login/logout
  or any authenticated API call end-to-end locally.
- Dev server(s) run over HTTPS (self-signed cert in `ssl/`, gitignored); `start:ssr` reuses the same
  cert via `SSL_CERT_PATH`/`SSL_KEY_PATH` (see `.env.example`).
- There is no separate lint script configured; formatting is enforced via Prettier (`.prettierrc`:
  100-char width, single quotes, Angular parser for `.html`).
- Angular CLI schematics default to `standalone: false` for components/directives/pipes
  (`angular.json`) — new pieces should follow the existing NgModule pattern, not standalone APIs.

## Architecture

### Module/routing structure

`AppRoutingModule` (`src/app/app-routing-module.ts`) lazy-loads four feature modules by path:

- `/login` → `AuthModule`, no guards. Login, sign-up, and password-recovery are distinct routes
  sharing the same `Login` component (`auth-routing-module.ts`): `/login` (login), `/login/criar-conta`
  (sign-up), `/login/recuperar-senha` (password recovery) — each with its own `title` for SEO/
  browser-tab purposes. `Login` derives its initial `modo()` from `route.snapshot.routeConfig.path`,
  and `irPara()` navigates between them (`queryParamsHandling: 'preserve'` to keep `redirectUrl`)
  instead of just flipping a signal. The two post-submit confirmation screens (`signup-sent`,
  `forgot-sent`) stay as in-component state with no route of their own — they're transient, not
  something worth indexing or deep-linking to.
- `/completar-cadastro` → `CadastroModule`, guarded by `authGuard` only.
- `/convites/:token` → `ConviteModule` (public invite decision screen), guarded by `authGuard` then
  `accountGuard` — an unauthenticated or not-yet-registered visitor is bounced through login/cadastro
  and lands back on the same invite token via `redirectUrl` before ever seeing the invite.
- `/paineis` (default redirect target) → `PainelModule`, guarded by `authGuard` then `accountGuard`.

Invite link/response URL contract (frontend ⇄ `api-dashfinras`): when creating an invite,
`ConviteService.criarConvite` sends `urlFrontend: `${window.location.origin}/convites`` (no
token — see `painel-criar.ts`/`painel-detalhe.ts`); the API appends `/{token}` to build the link
it emails to the invitee, which is exactly this app's guarded `/convites/:token` route. Once on
that screen, `ConviteResponder` accepts/declines via `POST /api/convites/{token}/aprovar` and
`POST /api/convites/{token}/recusar` (`ConviteService.aprovarConvite`/`recusarConvite`) — same
token, no separate confirmation URL.

Route guard order matters: `authGuard` (`core/guards/auth.guard.ts`) awaits `AuthService`'s Supabase
session check and redirects to `/login?redirectUrl=...` if unauthenticated. `accountGuard`
(`core/guards/account.guard.ts`) then calls `AccountService.obterUsuario()` against the API; if the
API returns a `USER_NOT_FOUND` error code, it redirects to `/completar-cadastro?redirectUrl=...`
instead of failing. This two-step guard is how the app forces a Supabase-authenticated user to
finish registering an application-side user profile before reaching the dashboards. Sign-up
(`Login.criarConta()`) logs the user in automatically and sends them straight to
`/completar-cadastro`, skipping the guard's redirect round-trip.

### Auth wiring — BFF (own Node server), not client-side Supabase

Auth used to run client-side (`@supabase/supabase-js` in the browser, tokens in `localStorage` or
later a cross-site httpOnly cookie set by `api-dashfinras`). Both broke down in practice — the
first exposes tokens to XSS, the second requires `SameSite=None` cookies because front and API run
on different hosts/ports. The current design: **this app's own Node server is the only thing that
talks to Supabase Auth**, and it sets a same-origin httpOnly cookie for the browser holding the
Supabase JWT directly. No `SameSite=None` needed anywhere.

`api-dashfinras` no longer has `POST account/login`/`account/logout` endpoints (removed 2026-08-24,
see its `specs/002-remove-login-logout-endpoints/`) — it validates the Supabase JWT itself via
`Authorization: Bearer` (JWKS/OIDC discovery against Supabase), so there is **no server-to-server
session exchange** between this BFF and the API anymore. **Do not reintroduce a call to
`account/login`/`account/logout`** — that contract doesn't exist on the API and calling it will
404.

- `src/server.ts` (generated by `ng add @angular/ssr`, then customized) mounts the BFF's `/api/*`
  routes (via `src/server/create-api-app.ts`) before the Angular catch-all. All Angular routes are
  configured `RenderMode.Client` in `src/app/app.routes.server.ts` — **the app is still 100% CSR**;
  the Node server only hosts the static shell + the custom API routes, it does not render pages.
- `src/server/auth.ts` (`createAuthRouter`) implements `POST /api/auth/login|signup|reset-password|logout`
  and `GET /api/auth/session`. `login`/`signup` call Supabase Auth server-side and, on success, seal
  the access/refresh token pair (via `iron-session`) straight into this app's own same-origin
  cookie, `df_session` (`httpOnly`, `Secure`, `SameSite=Lax`) — no other network call involved.
  `logout` calls `supabaseAdmin.auth.signOut()` (best-effort) and destroys the cookie.
- **"Manter-se logado" / session persistence** (`src/server/session.ts`): the login form has a
  "Manter-se logado" checkbox (`manterLogado` in the `POST /api/auth/login` body). The session it
  creates has two profiles, tracked by `SessionData.persistente` and `SessionData.lastActivityAt`:
  - **Persistente** (checkbox marcado): cookie survives closing the browser; expires after **3
    days** of inactivity, sliding — renewed on every authenticated request (throttled to once per
    60s via `registrarAtividade`).
  - **Não persistente** (default, checkbox desmarcado): the cookie itself has no `Max-Age`
    (`configurarSessao` sets `cookieOptions.maxAge: undefined`, which iron-session treats as a
    browser-session cookie with no seal-level ttl), so it disappears when the browser closes — but
    the server *also* enforces a **1 hour** inactivity limit even while the tab stays open,
    checked via `sessaoExpiradaPorInatividade` in `getValidSession`.
  - Both limits are enforced server-side (never trust the cookie's own lifetime), and a session's
    `persistente` flag never changes after login — token refresh (`getValidSession`) always
    reapplies `configurarSessao(session, session.persistente)` so a non-persistent session can
    never turn persistent.
  - **Legacy sessions** (cookies issued before this feature, `persistente === undefined`) keep the
    old fixed 14-day ttl and are never invalidated (`LEGACY_TTL_SECONDS` in `session.ts`) — this
    compatibility branch can be removed once no such cookie can still be valid (14 days after this
    feature's deploy).
  - Sign-up's auto-login (`POST /api/auth/signup`) always creates a **non-persistent** session —
    the user never saw the checkbox.
- `src/server/session.ts` (`getValidSession`) decodes the JWT `exp`, and refreshes the session via
  Supabase (`refreshSession`) automatically when it's near expiry, before the token is used —
  shared by `GET /api/auth/session` and the proxy below. It also applies the inactivity check and
  sliding renewal described above.
- `src/server/api-proxy.ts` (`createApiProxy`) is a generic `http-proxy-middleware` proxy mounted at
  `/api`, after `/api/auth`. It reads `df_session`, injects `Authorization: Bearer` into the
  outgoing request to `api-dashfinras`, and responds `401 { code: 'not_authenticated' }` directly
  if there's no valid session (including when the inactivity limit above has been hit) — the
  browser only ever talks to this app's own origin, never to `api-dashfinras` directly. This is
  the **only** place the Supabase JWT reaches `api-dashfinras`, straight through as the Bearer token
  the API's own JWT middleware validates.
- The `supabaseAdmin` client is injected into `createAuthRouter`/`createApiProxy`/`createApiApp`
  rather than imported as a singleton, specifically so `src/server/auth.spec.ts` can pass test
  doubles — the Angular test runner blocks `vi.mock()` on relative imports.
- Client-side, `AuthService` (`core/services/auth.service.ts`) is now a thin `HttpClient` wrapper
  over `/api/auth/*` — no Supabase SDK in the browser bundle anymore. `waitUntilReady()` resolves
  after the boot-time `GET /api/auth/session` call; `isAuthenticated`/`nomeUsuario` reflect its
  response. `authGuard`/`accountGuard` are unchanged (same public API). `limparSessaoLocal()`
  clears the local auth state without calling the API — used by `logout()` and by
  `authExpiredInterceptor` below.
- `core/interceptors/auth-expired.interceptor.ts` (`authExpiredInterceptor`, registered in
  `app-module.ts` alongside `loadingInterceptor`): catches any `401 { code: 'not_authenticated' }`
  response from `/api/*` — i.e. a session that expired while the tab was already open (the
  inactivity limits above) — and redirects to `/login?redirectUrl=...`, same pattern as
  `authGuard`. It deliberately ignores `/api/auth/login|signup|reset-password|logout|session`
  (those already handle their own errors, and `/api/auth/session` never returns 401 — it responds
  `200 { authenticated: false }` instead, precisely to avoid a redirect loop with this
  interceptor).

### API layer

`core/services/*.service.ts` are thin `HttpClient` wrappers over `${environment.apiUrl}/<resource>`
(`environment.apiUrl` is always `/api`, same-origin — the Node BFF proxies it), returning typed
`Observable`s. `core/models/*.model.ts` mirror the API's request/response DTOs (naming follows the
API: `RequestX...Dto`, `ResponseX...Dto`, `GetXDto`, `AddXDto`). API error payloads are arrays of
`Erro { codigo, descricao }`; callers match on `codigo` (e.g. `USER_NOT_FOUND` in `accountGuard`)
and surface `descricao` to the user.

### Environments vs. server config

`src/environments/environment.ts` (dev) / `environment.prod.ts` (prod) — both **gitignored**, copy
from the `.example.ts` variants — hold only `apiUrl` (`/api`) and ship in the browser bundle. Real
secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_DASHFINRAS_URL`, `SESSION_COOKIE_SECRET`) live
**server-side only**, in `.env` (gitignored, copy from `.env.example`), loaded via `dotenv/config`
in `src/server.ts` — they never reach the browser bundle. There's no environment file replacement
wired in `angular.json` — `ng build` imports `environment.ts` directly.

### Related repo

The API (`api-dashfinras`, .NET) lives as a sibling directory and has its own CLAUDE.md. It trusts
the Supabase JWT directly (`Authorization: Bearer`, validated via JWKS) — the browser never talks
to it directly, only through this app's own Node BFF proxy (`api-proxy.ts`).

### Deploying to production

See [`docs/deploy.md`](docs/deploy.md) — **`BEHIND_PROXY=true` is easy to forget** (the app boots
fine without it, no error, it just silently stops forcing HTTPS on the session cookie). Also
covers the Cloudflare Tunnel (`cloudflared`) quirk: it does **not** add `X-Forwarded-Proto`
automatically, so `originRequest.headers` in its `config.yml` must inject it manually or every
request gets redirect-looped.

## Frontend patterns

See [`docs/padroes-frontend.md`](docs/padroes-frontend.md) for recurring implementation patterns
not obvious from a single component — most importantly: **this app runs without zone.js
(zoneless)**, so any component state updated inside a Promise `.then()` or a manual `.subscribe()`
callback must be a `signal()`, not a plain class field, or the view won't reliably re-render.
