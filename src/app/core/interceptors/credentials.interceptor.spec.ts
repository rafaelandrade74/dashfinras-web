import { HttpRequest, HttpResponse, HttpHandlerFn } from '@angular/common/http';
import { of } from 'rxjs';
import { credentialsInterceptor } from './credentials.interceptor';
import { environment } from '../../../environments/environment';

describe('credentialsInterceptor', () => {
  let next: HttpHandlerFn;
  let capturedRequest: HttpRequest<unknown>;

  beforeEach(() => {
    next = (req) => {
      capturedRequest = req;
      return of(new HttpResponse({ status: 200 }));
    };
  });

  it('ativa withCredentials em requisições para a API', () => {
    const req = new HttpRequest('GET', `${environment.apiUrl}/painel`);

    credentialsInterceptor(req, next).subscribe();

    expect(capturedRequest.withCredentials).toBe(true);
  });

  it('não altera requisições para fora da API', () => {
    const req = new HttpRequest('GET', 'https://outro-dominio.com/recurso');

    credentialsInterceptor(req, next).subscribe();

    expect(capturedRequest.withCredentials).toBe(false);
  });
});
