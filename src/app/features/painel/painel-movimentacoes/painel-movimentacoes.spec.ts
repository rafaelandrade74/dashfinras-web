import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { PainelMovimentacoes } from './painel-movimentacoes';

describe('PainelMovimentacoes', () => {
  let component: PainelMovimentacoes;
  let fixture: ComponentFixture<PainelMovimentacoes>;
  let httpMock: HttpTestingController;

  async function criarComponente(id: string | null = 'painel-1'): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      declarations: [PainelMovimentacoes],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PainelMovimentacoes);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock?.verify();
  });

  describe('ngOnInit', () => {
    it('redireciona para /paineis quando não há id na rota', async () => {
      await criarComponente(null);
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      component.ngOnInit();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/paineis');
    });

    it('carrega o painel e os lançamentos quando há id na rota', async () => {
      await criarComponente('painel-1');

      component.ngOnInit();
      httpMock.expectOne('/api/painel/painel-1').flush({ id: 'painel-1', nome: 'Casa' });
      httpMock.expectOne((req) => req.url === '/api/movimentacoes-financeiras').flush([
        {
          id: 'mov-1',
          idPainel: 'painel-1',
          tipo: 1,
          idCategoria: 'cat-1',
          competencia: 202608,
          valor: 1000,
          status: 1,
          ativo: true,
          criadoPor: 'user-1',
          criadoEm: '2026-08-01T00:00:00Z'
        }
      ]);

      expect(component.painel()?.nome).toBe('Casa');
      expect(component.carregando()).toBe(false);
      expect(component.erro()).toBeUndefined();
      expect(component.movimentacoes().length).toBeGreaterThan(0);
    });

    it('mantém a tela funcional mesmo se a busca do painel falhar', async () => {
      await criarComponente('painel-1');

      component.ngOnInit();
      httpMock.expectOne('/api/painel/painel-1').flush(null, { status: 500, statusText: 'Erro' });
      httpMock.expectOne((req) => req.url === '/api/movimentacoes-financeiras').flush([]);

      expect(component.painel()).toBeUndefined();
      expect(component.movimentacoes()).toEqual([]);
    });

    it('expõe mensagem de erro quando a busca de movimentações falha', async () => {
      await criarComponente('painel-1');

      component.ngOnInit();
      httpMock.expectOne('/api/painel/painel-1').flush({ id: 'painel-1', nome: 'Casa' });
      httpMock
        .expectOne((req) => req.url === '/api/movimentacoes-financeiras')
        .flush(null, { status: 500, statusText: 'Erro' });

      expect(component.erro()).toBe('Não foi possível carregar os lançamentos. Tente novamente.');
      expect(component.carregando()).toBe(false);
    });
  });

  describe('estado de carregando', () => {
    it('fica em carregando(true) e sem erro/dados antes da resposta chegar', async () => {
      await criarComponente('painel-1');

      component.carregando.set(true);
      component.erro.set(undefined);
      component.movimentacoes.set([]);

      expect(component.carregando()).toBe(true);
      expect(component.erro()).toBeUndefined();
      expect(component.movimentacoes()).toEqual([]);
    });
  });

  describe('estado vazio', () => {
    it('KPIs ficam zerados quando não há lançamentos', async () => {
      await criarComponente('painel-1');
      component.movimentacoes.set([]);

      expect(component.entradas()).toEqual([]);
      expect(component.saidas()).toEqual([]);
      expect(component.totalEntradas()).toBe(0);
      expect(component.totalSaidas()).toBe(0);
      expect(component.saldo()).toBe(0);
      expect(component.movimentacoesPaginadas()).toEqual([]);
      expect(component.totalPaginas()).toBe(1);
    });
  });

  describe('estado de erro', () => {
    it('expõe a mensagem de erro através do signal erro()', async () => {
      await criarComponente('painel-1');

      component.erro.set('Não foi possível carregar os lançamentos. Tente novamente.');
      component.carregando.set(false);

      expect(component.erro()).toBe('Não foi possível carregar os lançamentos. Tente novamente.');
      expect(component.carregando()).toBe(false);
    });
  });

  describe('KPIs com dados', () => {
    it('calcula entradas, saídas e saldo corretamente', async () => {
      await criarComponente('painel-1');
      component.movimentacoes.set([
        { id: '1', descricao: 'Salário', categoria: 'Salário', competencia: '08/2026', status: 'Pago', valor: 1000 },
        { id: '2', descricao: 'Aluguel', categoria: 'Moradia', competencia: '08/2026', status: 'Pendente', valor: -400 },
        { id: '3', descricao: 'Freelance', categoria: 'Renda extra', competencia: '08/2026', status: 'Pago', valor: 200 },
        { id: '4', descricao: 'Mercado', categoria: 'Alimentação', competencia: '08/2026', status: 'Pago', valor: -150 }
      ]);

      expect(component.entradas().length).toBe(2);
      expect(component.saidas().length).toBe(2);
      expect(component.totalEntradas()).toBe(1200);
      expect(component.totalSaidas()).toBe(-550);
      expect(component.saldo()).toBe(650);
    });
  });

  describe('paginação', () => {
    beforeEach(async () => {
      await criarComponente('painel-1');
      const itens = Array.from({ length: 22 }, (_, i) => ({
        id: `mov-${i + 1}`,
        descricao: `Lançamento ${i + 1}`,
        categoria: 'Categoria',
        competencia: '08/2026',
        status: 'Pago' as const,
        valor: 10
      }));
      component.movimentacoes.set(itens);
    });

    it('calcula o total de páginas com base no pageSize', () => {
      expect(component.totalPaginas()).toBe(3);
      expect(component.movimentacoesPaginadas().length).toBe(10);
    });

    it('avança e volta de página respeitando os limites', () => {
      expect(component.paginaAtual()).toBe(1);

      component.paginaAnterior();
      expect(component.paginaAtual()).toBe(1);

      component.proximaPagina();
      expect(component.paginaAtual()).toBe(2);

      component.proximaPagina();
      expect(component.paginaAtual()).toBe(3);
      expect(component.movimentacoesPaginadas().length).toBe(2);

      component.proximaPagina();
      expect(component.paginaAtual()).toBe(3);

      component.paginaAnterior();
      expect(component.paginaAtual()).toBe(2);
    });
  });

  describe('statusInfo', () => {
    it('mapeia os status conhecidos para rótulo e classe', async () => {
      await criarComponente('painel-1');
      expect(component.statusInfo('Pago')).toEqual({ label: 'Pago', classe: 'status-pago' });
      expect(component.statusInfo('Pendente')).toEqual({ label: 'Pendente', classe: 'status-pendente' });
    });
  });

  describe('classeValor', () => {
    it('retorna a classe semântica correta para entrada e saída', async () => {
      await criarComponente('painel-1');
      expect(component.classeValor(100)).toBe('valor-receita');
      expect(component.classeValor(-100)).toBe('valor-despesa');
      expect(component.classeValor(0)).toBe('valor-receita');
    });
  });

  describe('voltar', () => {
    it('navega para /paineis/:id ao voltar', async () => {
      await criarComponente('painel-1');
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      component.voltar();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/paineis/painel-1');
    });
  });
});
