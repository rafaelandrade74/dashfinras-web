import request from 'supertest';
import type { Express } from 'express';
import { createApiApp } from './create-api-app';

process.env['SESSION_COOKIE_SECRET'] = 'a'.repeat(32);
process.env['API_DASHFINRAS_URL'] = 'https://api.test.local/api';

// JWT com exp bem no futuro (payload: {"exp": 4102444800, "email": "rafael@exemplo.com"}).
const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoicmFmYWVsQGV4ZW1wbG8uY29tIn0.assinatura';
const REFRESH_TOKEN = 'refresh-token-123';

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

  const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

  const app: Express = createApiApp({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin: { auth } as any,
    fetchFn,
  });

  return { app, auth, fetchFn };
}

describe('POST /api/auth/login', () => {
  it('seta o cookie df_session e chama a API .NET com Authorization: Bearer quando as credenciais são válidas', async () => {
    const { app, auth, fetchFn } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });

    const resposta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });

    expect(resposta.status).toBe(200);
    expect(resposta.headers['set-cookie']?.[0]).toContain('df_session=');
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.test.local/api/account/login',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${ACCESS_TOKEN}` }),
      }),
    );
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
  it('limpa o cookie mesmo se a chamada à API .NET falhar', async () => {
    const { app, auth, fetchFn } = criarApp();
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: ACCESS_TOKEN, refresh_token: REFRESH_TOKEN } },
      error: null,
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rafael@exemplo.com', password: 'senha123' });
    const cookie = loginRes.headers['set-cookie'];

    fetchFn.mockRejectedValue(new Error('API fora do ar'));

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
  it('responde 401 direto, sem chamar a API .NET, quando não há cookie válido', async () => {
    const { app, fetchFn } = criarApp();

    const resposta = await request(app).get('/api/account');

    expect(resposta.status).toBe(401);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
