import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse, HttpHandlerFn } from '@angular/common/http';
import { of } from 'rxjs';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';

describe('loadingInterceptor', () => {
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    loadingService = TestBed.inject(LoadingService);
  });

  it('ativa o loading durante a requisição e desativa ao concluir', () => {
    const req = new HttpRequest('GET', '/api/painel');
    const next: HttpHandlerFn = () => of(new HttpResponse({ status: 200 }));

    const valores: boolean[] = [];
    loadingService.isLoading$.subscribe((v) => valores.push(v));

    TestBed.runInInjectionContext(() => {
      loadingInterceptor(req, next).subscribe();
    });

    expect(valores).toEqual([false, true, false]);
  });
});
