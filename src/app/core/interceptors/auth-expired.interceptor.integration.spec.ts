import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authExpiredInterceptor } from './auth-expired.interceptor';

// Usa o AuthService REAL: o construtor dele já dispara GET /api/auth/session, que passa pelo
// interceptor. Se o interceptor injetar AuthService de forma eager, isso vira dependência
// circular e a aplicação trava na tela de carregamento.
describe('authExpiredInterceptor com AuthService real', () => {
  it('não gera dependência circular ao instanciar o AuthService', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authExpiredInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl: vi.fn(), url: '/' } },
      ],
    });

    const httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(AuthService);

    httpMock.expectOne('/api/auth/session').flush({ authenticated: false });
    await service.waitUntilReady();

    expect(service.isAuthenticated).toBe(false);
    httpMock.verify();
  });
});
