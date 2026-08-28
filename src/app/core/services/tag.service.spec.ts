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

  it('criar envia POST com o nome informado', () => {
    let resultado: ResponseTagDto | undefined;
    service.criar('recorrente').subscribe((res) => (resultado = res));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nome: 'recorrente' });
    req.flush({ id: 'tag-1', nome: 'recorrente', criadoEm: '2026-08-01T00:00:00Z' });

    expect(resultado?.id).toBe('tag-1');
  });

  it('listar desembrulha o envelope { tags }', () => {
    let resultado: ResponseTagDto[] | undefined;
    service.listar().subscribe((res) => (resultado = res));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ tags: [{ id: 'tag-1', nome: 'recorrente', criadoEm: '2026-08-01T00:00:00Z' }] });

    expect(resultado).toEqual([{ id: 'tag-1', nome: 'recorrente', criadoEm: '2026-08-01T00:00:00Z' }]);
  });

  it('listar retorna array vazio quando o envelope não traz tags', () => {
    let resultado: ResponseTagDto[] | undefined;
    service.listar().subscribe((res) => (resultado = res));

    httpMock.expectOne(baseUrl).flush({});

    expect(resultado).toEqual([]);
  });

  it('resolverIdsPorNome não faz chamada nenhuma para lista vazia', () => {
    let resultado: string[] | undefined;
    service.resolverIdsPorNome([]).subscribe((res) => (resultado = res));

    expect(resultado).toEqual([]);
  });

  it('resolverIdsPorNome ignora nomes em branco/duplicados e reaproveita tags existentes (case-insensitive)', () => {
    let resultado: string[] | undefined;
    service.resolverIdsPorNome(['Recorrente', '  ', 'recorrente', 'cartão']).subscribe((res) => (resultado = res));

    const reqListar = httpMock.expectOne(baseUrl);
    expect(reqListar.request.method).toBe('GET');
    reqListar.flush({ tags: [{ id: 'tag-1', nome: 'recorrente', criadoEm: '2026-08-01T00:00:00Z' }] });

    const reqCriar = httpMock.expectOne(baseUrl);
    expect(reqCriar.request.method).toBe('POST');
    expect(reqCriar.request.body).toEqual({ nome: 'cartão' });
    reqCriar.flush({ id: 'tag-2', nome: 'cartão', criadoEm: '2026-08-01T00:00:00Z' });

    expect(resultado).toEqual(['tag-1', 'tag-2']);
  });
});
