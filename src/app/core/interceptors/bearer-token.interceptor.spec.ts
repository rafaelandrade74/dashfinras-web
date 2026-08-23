import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpHandlerFn } from '@angular/common/http';
import { of } from 'rxjs';
import { bearerTokenInterceptor } from './bearer-token.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('bearerTokenInterceptor', () => {
  let authServiceMock: { token: string | undefined };
  let next: HttpHandlerFn;
  let capturedRequest: HttpRequest<unknown>;

  beforeEach(() => {
    authServiceMock = { token: 'access-token-123' };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    });

    next = (req) => {
      capturedRequest = req;
      return of(new HttpResponse({ status: 200 }));
    };
  });

  it('anexa o bearer token em requisições para a API', () => {
    const req = new HttpRequest('GET', `${environment.apiUrl}/painel`);

    TestBed.runInInjectionContext(() => {
      bearerTokenInterceptor(req, next).subscribe();
    });

    expect(capturedRequest.headers.get('Authorization')).toBe('Bearer access-token-123');
  });

  it('não anexa o bearer token em requisições para fora da API', () => {
    const req = new HttpRequest('GET', 'https://outro-dominio.com/recurso');

    TestBed.runInInjectionContext(() => {
      bearerTokenInterceptor(req, next).subscribe();
    });

    expect(capturedRequest.headers.has('Authorization')).toBe(false);
  });

  it('não anexa o bearer token quando não há sessão autenticada', () => {
    authServiceMock.token = undefined;
    const req = new HttpRequest('GET', `${environment.apiUrl}/painel`);

    TestBed.runInInjectionContext(() => {
      bearerTokenInterceptor(req, next).subscribe();
    });

    expect(capturedRequest.headers.has('Authorization')).toBe(false);
  });
});
