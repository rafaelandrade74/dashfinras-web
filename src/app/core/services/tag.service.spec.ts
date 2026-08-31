import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TagService } from './tag.service';
import { ResponseTagDto } from '../models/tag.model';

describe('TagService', () => {
  let service: TagService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/tag';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listar desembrulha o envelope { tags }', () => {
    let resultado: ResponseTagDto[] | undefined;
    service.listar('painel-1').subscribe((res) => (resultado = res));

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ tags: [{ id: 'tag-1', nome: 'recorrente', criadoEm: '2026-08-01T00:00:00Z' }] });

    expect(resultado).toEqual([{ id: 'tag-1', nome: 'recorrente', criadoEm: '2026-08-01T00:00:00Z' }]);
  });

  it('listar retorna array vazio quando o envelope não traz tags', () => {
    let resultado: ResponseTagDto[] | undefined;
    service.listar('painel-1').subscribe((res) => (resultado = res));

    httpMock.expectOne((r) => r.url === baseUrl).flush({});

    expect(resultado).toEqual([]);
  });

  it('listar(idPainel) envia a query string idPainel para escopar as tags por painel', () => {
    let resultado: ResponseTagDto[] | undefined;
    service.listar('painel-1').subscribe((res) => (resultado = res));

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.get('idPainel')).toBe('painel-1');
    req.flush({ tags: [{ id: 'tag-1', nome: 'recorrente', criadoEm: '2026-08-01T00:00:00Z' }] });

    expect(resultado).toEqual([{ id: 'tag-1', nome: 'recorrente', criadoEm: '2026-08-01T00:00:00Z' }]);
  });
});
