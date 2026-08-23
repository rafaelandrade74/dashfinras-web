import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('inicia sem loading', () => {
    let isLoading: boolean | undefined;
    service.isLoading$.subscribe((v) => (isLoading = v));

    expect(isLoading).toBe(false);
  });

  it('fica em loading enquanto houver requisições ativas', () => {
    const valores: boolean[] = [];
    service.isLoading$.subscribe((v) => valores.push(v));

    service.show();
    service.show();
    expect(valores).toEqual([false, true]);

    service.hide();
    expect(valores).toEqual([false, true]);

    service.hide();
    expect(valores).toEqual([false, true, false]);
  });

  it('não fica negativo ao chamar hide() sem show() correspondente', () => {
    const valores: boolean[] = [];
    service.isLoading$.subscribe((v) => valores.push(v));

    service.hide();
    service.show();

    expect(valores).toEqual([false, true]);
  });
});
