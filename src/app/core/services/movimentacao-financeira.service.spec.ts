import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MovimentacaoFinanceiraService } from './movimentacao-financeira.service';
import {
  AgregacaoFinanceiraDto,
  ResponseMovimentacaoDto,
  ResponseMovimentacoesFinanceirasDto,
  StatusMovimentacao,
  TipoMovimentacao
} from '../models/movimentacao-financeira.model';
import { environment } from '../../../environments/environment';

describe('MovimentacaoFinanceiraService', () => {
  let service: MovimentacaoFinanceiraService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/movimentacao`;

  const movimentacao: ResponseMovimentacaoDto = {
    id: 'mov-1',
    idPainel: 'painel-1',
    tipo: TipoMovimentacao.Despesa,
    idCategoria: 'categoria-1',
    competencia: 202601,
    valor: 150.5,
    status: StatusMovimentacao.Pendente,
    ativo: true,
    criadoPor: 'user-1',
    criadoEm: '2026-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MovimentacaoFinanceiraService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('registrar envia POST para a base url e retorna a movimentação criada', () => {
    let resultado: ResponseMovimentacaoDto | undefined;

    service
      .registrar({
        idPainel: 'painel-1',
        tipo: TipoMovimentacao.Despesa,
        idCategoria: 'categoria-1',
        competencia: 202601,
        valor: 150.5
      })
      .subscribe((res) => (resultado = res));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush(movimentacao);

    expect(resultado).toEqual(movimentacao);
  });

  it('registrar propaga erro do servidor', () => {
    let erro: unknown;

    service
      .registrar({
        idPainel: 'painel-1',
        tipo: TipoMovimentacao.Receita,
        idCategoria: 'categoria-1',
        competencia: 202601,
        valor: 10
      })
      .subscribe({ error: (err) => (erro = err) });

    const req = httpMock.expectOne(baseUrl);
    req.flush({ message: 'erro' }, { status: 400, statusText: 'Bad Request' });

    expect(erro).toBeTruthy();
  });

  it('marcarComoPago envia PUT com dataPagamento', () => {
    let resultado: ResponseMovimentacaoDto | undefined;

    service.marcarComoPago('mov-1', '2026-01-10').subscribe((res) => (resultado = res));

    const req = httpMock.expectOne(`${baseUrl}/mov-1/marcar-como-pago`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ dataPagamento: '2026-01-10' });
    req.flush({ ...movimentacao, status: StatusMovimentacao.Pago, dataPagamento: '2026-01-10' });

    expect(resultado?.status).toBe(StatusMovimentacao.Pago);
  });

  it('marcarComoPago propaga erro do servidor', () => {
    let erro: unknown;

    service.marcarComoPago('mov-1', '2026-01-10').subscribe({ error: (err) => (erro = err) });

    const req = httpMock.expectOne(`${baseUrl}/mov-1/marcar-como-pago`);
    req.flush({ message: 'erro' }, { status: 404, statusText: 'Not Found' });

    expect(erro).toBeTruthy();
  });

  it('associarTags envia PUT com a lista de ids', () => {
    let concluiu = false;

    service.associarTags('mov-1', ['tag-1', 'tag-2']).subscribe(() => (concluiu = true));

    const req = httpMock.expectOne(`${baseUrl}/mov-1/tags`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idsTags: ['tag-1', 'tag-2'] });
    req.flush(null);

    expect(concluiu).toBe(true);
  });

  it('associarTags propaga erro do servidor', () => {
    let erro: unknown;

    service.associarTags('mov-1', ['tag-1']).subscribe({ error: (err) => (erro = err) });

    const req = httpMock.expectOne(`${baseUrl}/mov-1/tags`);
    req.flush({ message: 'erro' }, { status: 400, statusText: 'Bad Request' });

    expect(erro).toBeTruthy();
  });

  it('cancelar envia DELETE para o id informado', () => {
    let concluiu = false;

    service.cancelar('mov-1').subscribe(() => (concluiu = true));

    const req = httpMock.expectOne(`${baseUrl}/mov-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(concluiu).toBe(true);
  });

  it('cancelar propaga erro do servidor', () => {
    let erro: unknown;

    service.cancelar('mov-1').subscribe({ error: (err) => (erro = err) });

    const req = httpMock.expectOne(`${baseUrl}/mov-1`);
    req.flush({ message: 'erro' }, { status: 404, statusText: 'Not Found' });

    expect(erro).toBeTruthy();
  });

  it('consultar envia GET com os filtros informados como query params', () => {
    let resultado: ResponseMovimentacoesFinanceirasDto | undefined;

    service
      .consultar({ idPainel: 'painel-1', competencia: 202601, status: StatusMovimentacao.Pendente })
      .subscribe((res) => (resultado = res));

    const req = httpMock.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('idPainel') === 'painel-1' &&
        r.params.get('competencia') === '202601' &&
        r.params.get('status') === String(StatusMovimentacao.Pendente)
    );
    expect(req.request.method).toBe('GET');
    req.flush({ movimentacoes: [movimentacao], totalRegistros: 1, temProximaPagina: false });

    expect(resultado).toEqual({ movimentacoes: [movimentacao], totalRegistros: 1, temProximaPagina: false });
  });

  it('consultar envia pagina e tamanhoPagina quando informados', () => {
    service.consultar({ idPainel: 'painel-1', pagina: 2, tamanhoPagina: 50 }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.get('pagina') === '2' && r.params.get('tamanhoPagina') === '50'
    );
    req.flush({ movimentacoes: [], totalRegistros: 0, temProximaPagina: false });
  });

  it('consultar repassa totalRegistros/temProximaPagina para o chamador', () => {
    let resultado: ResponseMovimentacoesFinanceirasDto | undefined;

    service.consultar({ idPainel: 'painel-1' }).subscribe((res) => (resultado = res));

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    req.flush({ movimentacoes: [movimentacao], totalRegistros: 137, temProximaPagina: true });

    expect(resultado?.totalRegistros).toBe(137);
    expect(resultado?.temProximaPagina).toBe(true);
  });

  it('consultar omite filtros não informados', () => {
    service.consultar({}).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ movimentacoes: [], totalRegistros: 0, temProximaPagina: false });
  });

  it('consultar propaga erro do servidor', () => {
    let erro: unknown;

    service.consultar({ idPainel: 'painel-1' }).subscribe({ error: (err) => (erro = err) });

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    req.flush({ message: 'erro' }, { status: 500, statusText: 'Server Error' });

    expect(erro).toBeTruthy();
  });

  it('obterAgregacao envia GET com o filtro completo informado', () => {
    let resultado: AgregacaoFinanceiraDto | undefined;
    const agregacao: AgregacaoFinanceiraDto = {
      competencia: 202601,
      totalReceitas: 1000,
      totalDespesas: 400,
      saldo: 600,
      quantidadeEntradas: 3,
      quantidadeSaidas: 5
    };

    service
      .obterAgregacao({ idPainel: 'painel-1', competencia: 202601, idCategoria: 'categoria-1' })
      .subscribe((res) => (resultado = res));

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${baseUrl}/agregacao` &&
        r.params.get('competencia') === '202601' &&
        r.params.get('idPainel') === 'painel-1' &&
        r.params.get('idCategoria') === 'categoria-1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(agregacao);

    expect(resultado).toEqual(agregacao);
  });

  it('obterAgregacao funciona sem competência informada (agora opcional)', () => {
    let resultado: AgregacaoFinanceiraDto | undefined;

    service.obterAgregacao({ idPainel: 'painel-1' }).subscribe((res) => (resultado = res));

    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/agregacao` && r.params.get('idPainel') === 'painel-1'
    );
    expect(req.request.params.has('competencia')).toBe(false);
    req.flush({ competencia: null, totalReceitas: 0, totalDespesas: 0, saldo: 0, quantidadeEntradas: 0, quantidadeSaidas: 0 });

    expect(resultado?.competencia).toBeNull();
  });

  it('obterAgregacao omite filtros não informados', () => {
    service.obterAgregacao({}).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/agregacao`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ competencia: null, totalReceitas: 0, totalDespesas: 0, saldo: 0, quantidadeEntradas: 0, quantidadeSaidas: 0 });
  });

  it('obterAgregacao propaga erro do servidor', () => {
    let erro: unknown;

    service.obterAgregacao({ idPainel: 'painel-1' }).subscribe({ error: (err) => (erro = err) });

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/agregacao`);
    req.flush({ message: 'erro' }, { status: 500, statusText: 'Server Error' });

    expect(erro).toBeTruthy();
  });
});
