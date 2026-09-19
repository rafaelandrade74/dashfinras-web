import request from 'supertest';
import type { Express } from 'express';
import { sealData } from 'iron-session';
import { createApiApp } from './create-api-app';
import type { SessionData } from './session';

process.env['SESSION_COOKIE_SECRET'] = 'a'.repeat(32);
process.env['API_DASHFINRAS_URL'] = 'https://api.test.local/api';

// JWT com exp bem no futuro (payload: {"exp": 4102444800, "email": "rafael@exemplo.com"}).
const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoicmFmYWVsQGV4ZW1wbG8uY29tIn0.assinatura';
const REFRESH_TOKEN = 'refresh-token-123';

// Constrói um JWT (sem assinatura válida — decodeJwtExp não valida) com o `exp` desejado, para
// forçar o ramo de refresh de token em getValidSession (exp perto de agora).
function tokenComExp(expSegundos: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ exp: expSegundos, email: 'rafael@exemplo.com' }),
  ).toString('base64url');
  return `${header}.${payload}.assinatura`;
}

// Sela manualmente um cookie df_session "legado": mesmo formato usado antes desta feature, sem os
// campos persistente/lastActivityAt. Simula uma sessão emitida antes do deploy (FR-006).
async function cookieLegado(dados: Pick<SessionData, 'accessToken' | 'refreshToken' | 'expiresAt'>) {
  const seal = await sealData(dados, {
    password: process.env['SESSION_COOKIE_SECRET']!,
    ttl: 60 * 60 * 24 * 14,
  });
  return `df_session=${seal}`;
}

function criarApp(overrides?: {
  supabaseAdmin?: Partial<{ auth: Record<string, ReturnType<typeof vi.fn>> }>;
}) {
  const auth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn(),
    refreshSession: vi.fn(),
    ...overrides?.supabaseAdmin?.auth,
  };

  const app: Express = createApiApp({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin: { auth } as any,
  });

  return { app, auth };
}

describe('POST /api/auth/login', () => {
  it('seta o cookie df_session quando as credenciais são válidas, sem chamar a API .NET', async () => {
    const { app, auth } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });

    expect(resposta.status).toBe(200);
    expect(resposta.headers['set-cookie']?.[0]).toContain('df_session=');
  });

  it('responde 401 sem setar cookie quando as credenciais são inválidas', async () => {
    const { app, auth } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'errada' });

    expect(resposta.status).toBe(401);
    expect(resposta.body.code).toBe('invalid_credentials');
    expect(resposta.headers['set-cookie']).toBeUndefined();
  });

  it('com manterLogado=true, seta cookie persistente (com Max-Age de ~3 dias)', async () => {
    const { app, auth } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123', manterLogado: true });

    const cookie = resposta.headers['set-cookie'][0];
    expect(cookie).toMatch(/Max-Age=\d+/);
    const maxAge = Number(cookie.match(/Max-Age=(\d+)/)?.[1]);
    // 3 dias (259200s) menos o skew que o iron-session subtrai do Max-Age do cookie.
    expect(maxAge).toBeGreaterThan(259200 - 120);
    expect(maxAge).toBeLessThanOrEqual(259200);
  });

  it('sem manterLogado (ausente), seta cookie de sessão do navegador (sem Max-Age)', async () => {
    const { app, auth } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });

    const cookie = resposta.headers['set-cookie'][0];
    expect(cookie).not.toMatch(/Max-Age=/);
    expect(cookie).not.toMatch(/Expires=/);
  });

  it('com manterLogado não-booleano (ex.: string "true"), trata como false', async () => {
    const { app, auth } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123', manterLogado: 'true' });

    const cookie = resposta.headers['set-cookie'][0];
    expect(cookie).not.toMatch(/Max-Age=/);
  });
});

describe('GET /api/auth/session', () => {
  it('responde não-autenticado quando não há cookie', async () => {
    const { app } = criarApp();

    const resposta = await request(app).get('/api/auth/session');

    expect(resposta.body).toEqual({ authenticated: false });
  });

  it('responde autenticado com os dados do usuário quando há um cookie válido', async () => {
    const { app, auth } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });

    // supertest não roda sobre TLS, então o cookie jar do .agent() descarta cookies com
    // Secure=true entre chamadas — repassar manualmente o Set-Cookie do login.
    const resposta = await request(app)
      .get('/api/auth/session')
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(resposta.body).toEqual({
      authenticated: true,
      email: 'rafael@exemplo.com',
      nome: 'rafael@exemplo.com',
    });
  });
});

describe('POST /api/auth/logout', () => {
  it('limpa o cookie mesmo se o signOut do Supabase falhar', async () => {
    const { app, auth } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });
    const cookie = loginRes.headers['set-cookie'];

    auth.signOut.mockRejectedValue(new Error('Supabase fora do ar'));

    const respostaLogout = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(respostaLogout.status).toBe(200);

    const cookieAposLogout = respostaLogout.headers['set-cookie'];
    const respostaSession = await request(app)
      .get('/api/auth/session')
      .set('Cookie', cookieAposLogout);
    expect(respostaSession.body).toEqual({ authenticated: false });
  });
});

describe('proxy /api/*', () => {
  it('responde 401 direto quando não há cookie válido', async () => {
    const { app } = criarApp();

    const resposta = await request(app).get('/api/account');

    expect(resposta.status).toBe(401);
  });
});

describe('sessão não persistente (US2): expiração por inatividade de 1h', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  async function loginNaoPersistente(app: Express, auth: ReturnType<typeof criarApp>['auth']) {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });
    return resposta.headers['set-cookie'];
  }

  it('após 1h sem uso, GET /api/auth/session responde não-autenticado e limpa o cookie', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(inicio);

    const { app, auth } = criarApp();
    const cookie = await loginNaoPersistente(app, auth);

    vi.setSystemTime(new Date(inicio.getTime() + 61 * 60 * 1000));
    const resposta = await request(app).get('/api/auth/session').set('Cookie', cookie);

    expect(resposta.body).toEqual({ authenticated: false });
    expect(resposta.headers['set-cookie']?.[0]).toMatch(/Max-Age=0/);
  });

  it('após 1h sem uso, o proxy /api/* responde 401 not_authenticated', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(inicio);

    const { app, auth } = criarApp();
    const cookie = await loginNaoPersistente(app, auth);

    vi.setSystemTime(new Date(inicio.getTime() + 61 * 60 * 1000));
    const resposta = await request(app).get('/api/account').set('Cookie', cookie);

    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({ code: 'not_authenticated' });
  });

  it('uso a cada 30min renova o prazo e mantém a sessão válida além de 1h do login original', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(inicio);

    const { app, auth } = criarApp();
    let cookie = await loginNaoPersistente(app, auth);

    for (let minutos = 30; minutos <= 90; minutos += 30) {
      vi.setSystemTime(new Date(inicio.getTime() + minutos * 60 * 1000));
      const resposta = await request(app).get('/api/auth/session').set('Cookie', cookie);
      expect(resposta.body.authenticated).toBe(true);
      cookie = resposta.headers['set-cookie'] ?? cookie;
    }
  });

  it('throttle: duas chamadas em menos de 60s não regravam o cookie', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(inicio);

    const { app, auth } = criarApp();
    const cookie = await loginNaoPersistente(app, auth);

    vi.setSystemTime(new Date(inicio.getTime() + 30 * 1000));
    const resposta = await request(app).get('/api/auth/session').set('Cookie', cookie);

    expect(resposta.body.authenticated).toBe(true);
    expect(resposta.headers['set-cookie']).toBeUndefined();
  });

  it('refresh do access_token em sessão não persistente mantém persistente=false (cookie sem Max-Age)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(inicio);

    const { app, auth } = criarApp();

    // Login já com um token perto de expirar, para forçar o ramo de refresh na próxima chamada.
    auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: tokenComExp(Math.floor(inicio.getTime() / 1000) + 30),
          refresh_token: REFRESH_TOKEN,
        },
      },
      error: null,
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });
    const cookie = loginRes.headers['set-cookie'];

    auth.refreshSession.mockResolvedValue({
      data: {
        session: { access_token: ACCESS_TOKEN, refresh_token: 'novo-refresh-token' },
      },
      error: null,
    });

    vi.setSystemTime(new Date(inicio.getTime() + 45 * 1000)); // passa dos 30s de exp do token
    const resposta = await request(app).get('/api/auth/session').set('Cookie', cookie);

    expect(auth.refreshSession).toHaveBeenCalled();
    expect(resposta.body.authenticated).toBe(true);
    const cookieRenovado = resposta.headers['set-cookie']?.[0];
    expect(cookieRenovado).not.toMatch(/Max-Age=/);
  });
});

describe('sessão persistente (US3): expiração deslizante de 3 dias', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  async function loginPersistente(app: Express, auth: ReturnType<typeof criarApp>['auth']) {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });
    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123', manterLogado: true });
    return resposta.headers['set-cookie'];
  }

  it('após 3 dias sem uso, responde não-autenticado e limpa o cookie', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(inicio);

    const { app, auth } = criarApp();
    const cookie = await loginPersistente(app, auth);

    vi.setSystemTime(new Date(inicio.getTime() + (3 * 24 * 60 + 1) * 60 * 1000));
    const resposta = await request(app).get('/api/auth/session').set('Cookie', cookie);

    expect(resposta.body).toEqual({ authenticated: false });
  });

  it('uso a cada 2 dias mantém a sessão válida além de 3 dias do login original', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(inicio);

    const { app, auth } = criarApp();
    let cookie = await loginPersistente(app, auth);

    for (const dias of [2, 4]) {
      vi.setSystemTime(new Date(inicio.getTime() + dias * 24 * 60 * 60 * 1000));
      const resposta = await request(app).get('/api/auth/session').set('Cookie', cookie);
      expect(resposta.body.authenticated).toBe(true);
      cookie = resposta.headers['set-cookie'] ?? cookie;
    }
  });

  it('refresh do access_token em sessão persistente mantém persistente=true (Max-Age ~3 dias)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const inicio = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(inicio);

    const { app, auth } = criarApp();

    // Login já com um token perto de expirar, para forçar o ramo de refresh já na primeira
    // chamada seguinte.
    auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: tokenComExp(Math.floor(inicio.getTime() / 1000) + 30),
          refresh_token: REFRESH_TOKEN,
        },
      },
      error: null,
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123', manterLogado: true });
    const cookie = loginRes.headers['set-cookie'];

    auth.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: ACCESS_TOKEN, // token novo, com exp bem distante
          refresh_token: 'novo-refresh-token',
        },
      },
      error: null,
    });

    vi.setSystemTime(new Date(inicio.getTime() + 45 * 1000)); // passa dos 30s de exp do token
    const resposta = await request(app).get('/api/auth/session').set('Cookie', cookie);

    expect(auth.refreshSession).toHaveBeenCalled();
    expect(resposta.body.authenticated).toBe(true);

    const cookieRenovado = resposta.headers['set-cookie']?.[0];
    expect(cookieRenovado).toMatch(/Max-Age=\d+/);
  });

  it('logout destrói a sessão persistente e não persistente (cookie com Max-Age=0)', async () => {
    const { app, auth } = criarApp();

    const cookiePersistente = await loginPersistente(app, auth);
    const logoutPersistente = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookiePersistente);
    expect(logoutPersistente.headers['set-cookie']?.[0]).toMatch(/Max-Age=0/);

    const { app: app2, auth: auth2 } = criarApp();
    auth2.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });
    const loginNaoPersistenteRes = await request(app2)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });
    const logoutNaoPersistente = await request(app2)
      .post('/api/auth/logout')
      .set('Cookie', loginNaoPersistenteRes.headers['set-cookie']);
    expect(logoutNaoPersistente.headers['set-cookie']?.[0]).toMatch(/Max-Age=0/);
  });
});

describe('cadastro (US2/US8): sessão criada no signup é não persistente', () => {
  it('POST /api/auth/signup com sessão retornada grava cookie sem Max-Age (persistente=false)', async () => {
    const { app, auth } = criarApp();
    auth.signUp.mockResolvedValue({
      data: {
        session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN },
        user: { identities: [{ id: '1' }] },
      },
      error: null,
    });

    const resposta = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'novo@exemplo.com', password: 'Senha123!' });

    expect(resposta.status).toBe(200);
    const cookie = resposta.headers['set-cookie'][0];
    expect(cookie).not.toMatch(/Max-Age=/);
  });
});

describe('sessões legadas (FR-006): cookies emitidos antes desta feature continuam válidos', () => {
  it('cookie sem persistente/lastActivityAt continua autenticando e não é regravado como persistente/não persistente', async () => {
    const { app } = criarApp();
    const cookie = await cookieLegado({
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      expiresAt: 4102444800,
    });

    const resposta = await request(app).get('/api/auth/session').set('Cookie', cookie);

    expect(resposta.body).toEqual({
      authenticated: true,
      email: 'rafael@exemplo.com',
      nome: 'rafael@exemplo.com',
    });
    // Sessão legada: getValidSession não chama registrarAtividade (persistente === undefined),
    // então não deveria haver Set-Cookie nesta resposta.
    expect(resposta.headers['set-cookie']).toBeUndefined();
  });
});
