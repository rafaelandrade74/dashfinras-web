import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  function flushSessionCheck(authenticated = false): void {
    const req = httpMock.expectOne('/api/auth/session');
    req.flush({ authenticated });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('consulta GET /api/auth/session ao inicializar e reflete o estado retornado', async () => {
    const readyPromise = service.waitUntilReady();
    flushSessionCheck(true);

    await readyPromise;

    expect(service.isAuthenticated).toBe(true);
  });

  it('retorna erro amigável quando o servidor rejeita a chamada de login (ex.: falha de rede)', async () => {
    flushSessionCheck();

    const resultadoPromise = service.login('rafael@exemplo.com', 'senha123');
    httpMock.expectOne('/api/auth/login').error(new ProgressEvent('network error'));

    const resultado = await resultadoPromise;

    expect(resultado.error).toBe(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    );
  });

  it('traduz credenciais inválidas para mensagem em português', async () => {
    flushSessionCheck();

    const resultadoPromise = service.login('rafael@exemplo.com', 'senhaerrada');
    httpMock
      .expectOne('/api/auth/login')
      .flush({ code: 'invalid_credentials' }, { status: 401, statusText: 'Unauthorized' });

    const resultado = await resultadoPromise;

    expect(resultado.error).toBe(
      'E-mail ou senha incorretos. Verifique os dados e tente novamente.',
    );
  });

  it('marca como autenticado após login bem-sucedido', async () => {
    flushSessionCheck();

    const resultadoPromise = service.login('rafael@exemplo.com', 'senha123');
    httpMock.expectOne('/api/auth/login').flush({ ok: true });

    const resultado = await resultadoPromise;

    expect(resultado).toEqual({});
    expect(service.isAuthenticated).toBe(true);
  });

  it('retorna sucesso direto quando o cadastro já autentica (confirmação de e-mail desligada)', async () => {
    flushSessionCheck();

    const resultadoPromise = service.signUp('novo@exemplo.com', 'SenhaForte123!');
    httpMock.expectOne('/api/auth/signup').flush({ ok: true, requiresEmailConfirmation: false });

    const resultado = await resultadoPromise;

    expect(resultado).toEqual({});
    expect(service.isAuthenticated).toBe(true);
  });

  it('sinaliza que precisa confirmar e-mail quando o cadastro exige confirmação', async () => {
    flushSessionCheck();

    const resultadoPromise = service.signUp('novo@exemplo.com', 'SenhaForte123!');
    httpMock.expectOne('/api/auth/signup').flush({ ok: true, requiresEmailConfirmation: true });

    const resultado = await resultadoPromise;

    expect(resultado).toEqual({ precisaConfirmarEmail: true });
    expect(service.isAuthenticated).toBe(false);
  });

  it('traduz para "e-mail já cadastrado" quando o servidor retorna esse código', async () => {
    flushSessionCheck();

    const resultadoPromise = service.signUp('jacadastrado@exemplo.com', 'SenhaForte123!');
    httpMock
      .expectOne('/api/auth/signup')
      .flush({ code: 'already_registered' }, { status: 409, statusText: 'Conflict' });

    const resultado = await resultadoPromise;

    expect(resultado).toEqual({
      error: 'Este e-mail já está cadastrado. Tente entrar em vez de criar uma nova conta.',
    });
  });

  it('encaminha a redirectUrl informada para o servidor no cadastro', async () => {
    flushSessionCheck();

    const resultadoPromise = service.signUp('novo@exemplo.com', 'SenhaForte123!', '/paineis/123');
    const req = httpMock.expectOne('/api/auth/signup');
    expect(req.request.body).toEqual({
      email: 'novo@exemplo.com',
      password: 'SenhaForte123!',
      redirectUrl: '/paineis/123',
    });
    req.flush({ ok: true, requiresEmailConfirmation: true });

    await resultadoPromise;
  });

  it('limpa a sessão local ao fazer logout', async () => {
    flushSessionCheck(true);
    await service.waitUntilReady();
    expect(service.isAuthenticated).toBe(true);

    const logoutPromise = service.logout();
    httpMock.expectOne('/api/auth/logout').flush({ ok: true });
    await logoutPromise;

    expect(service.isAuthenticated).toBe(false);
  });
});
