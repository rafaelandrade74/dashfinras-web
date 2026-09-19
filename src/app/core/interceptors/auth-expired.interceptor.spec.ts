import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authExpiredInterceptor } from './auth-expired.interceptor';

describe('authExpiredInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: { limparSessaoLocal: ReturnType<typeof vi.fn> };
  let navigateByUrlSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    authServiceMock = { limparSessaoLocal: vi.fn() };
    navigateByUrlSpy = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authExpiredInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: { navigateByUrl: navigateByUrlSpy, url: '/paineis/123' } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('em 401 not_authenticated numa rota /api/* qualquer, limpa a sessão local e redireciona preservando a url atual', async () => {
    const resultadoPromise = new Promise<unknown>((resolve, reject) => {
      http.get('/api/paineis').subscribe({ next: resolve, error: reject });
    });

    httpMock
      .expectOne('/api/paineis')
      .flush({ code: 'not_authenticated' }, { status: 401, statusText: 'Unauthorized' });

    await expect(resultadoPromise).rejects.toBeTruthy();

    expect(authServiceMock.limparSessaoLocal).toHaveBeenCalledTimes(1);
    expect(navigateByUrlSpy).toHaveBeenCalledWith(
      `/login?redirectUrl=${encodeURIComponent('/paineis/123')}`,
    );
  });

  it('não aciona o interceptor quando o 401 not_authenticated vem de /api/auth/session', async () => {
    const resultadoPromise = new Promise<unknown>((resolve, reject) => {
      http.get('/api/auth/session').subscribe({ next: resolve, error: reject });
    });

    httpMock
      .expectOne('/api/auth/session')
      .flush({ code: 'not_authenticated' }, { status: 401, statusText: 'Unauthorized' });

    await expect(resultadoPromise).rejects.toBeTruthy();

    expect(authServiceMock.limparSessaoLocal).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('não aciona o interceptor em 401 de /api/auth/login com outro código (ex.: invalid_credentials)', async () => {
    const resultadoPromise = new Promise<unknown>((resolve, reject) => {
      http.post('/api/auth/login', {}).subscribe({ next: resolve, error: reject });
    });

    httpMock
      .expectOne('/api/auth/login')
      .flush({ code: 'invalid_credentials' }, { status: 401, statusText: 'Unauthorized' });

    await expect(resultadoPromise).rejects.toBeTruthy();

    expect(authServiceMock.limparSessaoLocal).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('não aciona o interceptor em 401 not_authenticated de /api/auth/logout (evita redirect duplo)', async () => {
    const resultadoPromise = new Promise<unknown>((resolve, reject) => {
      http.post('/api/auth/logout', {}).subscribe({ next: resolve, error: reject });
    });

    httpMock
      .expectOne('/api/auth/logout')
      .flush({ code: 'not_authenticated' }, { status: 401, statusText: 'Unauthorized' });

    await expect(resultadoPromise).rejects.toBeTruthy();

    expect(authServiceMock.limparSessaoLocal).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });

  it('não aciona o interceptor em respostas de sucesso', async () => {
    const resultadoPromise = new Promise<unknown>((resolve, reject) => {
      http.get('/api/paineis').subscribe({ next: resolve, error: reject });
    });

    httpMock.expectOne('/api/paineis').flush([]);

    await resultadoPromise;

    expect(authServiceMock.limparSessaoLocal).not.toHaveBeenCalled();
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });
});
