import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FiltroMovimentacoes, FiltroMovimentacoesDto } from './filtro-movimentacoes';

describe('FiltroMovimentacoes', () => {
  let component: FiltroMovimentacoes;
  let fixture: ComponentFixture<FiltroMovimentacoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDatepickerModule],
      declarations: [FiltroMovimentacoes],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(FiltroMovimentacoes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function ultimoFiltroEmitido(spy: ReturnType<typeof vi.fn>): FiltroMovimentacoesDto {
    return spy.mock.calls[spy.mock.calls.length - 1][0];
  }

  it('cria o componente com filtro vazio', () => {
    expect(component).toBeTruthy();
    expect(component.competencia()).toBe('');
    expect(component.categoria()).toBeUndefined();
    expect(component.status()).toBeUndefined();
    expect(component.tags()).toEqual([]);
  });

  describe('competenciaInicial', () => {
    it('pré-seleciona a competência informada (ex.: mês atual) antes de qualquer interação', () => {
      const outraFixture = TestBed.createComponent(FiltroMovimentacoes);
      outraFixture.componentInstance.competenciaInicial = '08/2026';
      outraFixture.detectChanges();

      expect(outraFixture.componentInstance.competencia()).toBe('08/2026');
    });

    it('mantém competência vazia quando nenhum valor inicial é informado', () => {
      const outraFixture = TestBed.createComponent(FiltroMovimentacoes);
      outraFixture.detectChanges();

      expect(outraFixture.componentInstance.competencia()).toBe('');
    });
  });

  describe('selecionarMesCompetencia', () => {
    it('preenche a competência no formato MM/AAAA e fecha o datepicker', () => {
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);
      const pickerMock = { close: vi.fn() } as any;

      component.selecionarMesCompetencia(new Date(2026, 7, 15), pickerMock);

      expect(component.competencia()).toBe('08/2026');
      expect(pickerMock.close).toHaveBeenCalled();
      expect(ultimoFiltroEmitido(spy).competencia).toBe('08/2026');
    });

    it('preenche mês com zero à esquerda', () => {
      const pickerMock = { close: vi.fn() } as any;

      component.selecionarMesCompetencia(new Date(2026, 0, 1), pickerMock);

      expect(component.competencia()).toBe('01/2026');
    });
  });

  describe('competência', () => {
    it('atualiza o signal e emite o filtro ao alterar a competência', () => {
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onCompetenciaChange('Ago/2026');

      expect(component.competencia()).toBe('Ago/2026');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(ultimoFiltroEmitido(spy).competencia).toBe('Ago/2026');
    });
  });

  describe('categoria', () => {
    it('atualiza o signal e emite o filtro ao selecionar uma categoria', () => {
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onCategoriaChange('Moradia');

      expect(component.categoria()).toBe('Moradia');
      expect(ultimoFiltroEmitido(spy).categoria).toBe('Moradia');
    });

    it('trata a opção "Todas" (valor vazio) como categoria indefinida', () => {
      component.onCategoriaChange('Moradia');
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onCategoriaChange('');

      expect(component.categoria()).toBeUndefined();
      expect(ultimoFiltroEmitido(spy).categoria).toBeUndefined();
    });
  });

  describe('status', () => {
    it.each(['Pendente', 'Pago'] as const)('atualiza o signal e emite o filtro para status "%s"', (status) => {
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onStatusChange(status);

      expect(component.status()).toBe(status);
      expect(ultimoFiltroEmitido(spy).status).toBe(status);
    });

    it('trata a opção "Todos" (valor vazio) como status indefinido', () => {
      component.onStatusChange('Pago');
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onStatusChange('');

      expect(component.status()).toBeUndefined();
      expect(ultimoFiltroEmitido(spy).status).toBeUndefined();
    });
  });

  describe('tags (chips-input)', () => {
    it('adiciona uma tag e emite o filtro', () => {
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onNovaTagChange('recorrente');
      component.adicionarTag();

      expect(component.tags()).toEqual(['recorrente']);
      expect(component.novaTag()).toBe('');
      expect(ultimoFiltroEmitido(spy).tags).toEqual(['recorrente']);
    });

    it('não adiciona tag em branco', () => {
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onNovaTagChange('   ');
      component.adicionarTag();

      expect(component.tags()).toEqual([]);
      expect(spy).not.toHaveBeenCalled();
    });

    it('não adiciona tag duplicada', () => {
      component.onNovaTagChange('cartão');
      component.adicionarTag();
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onNovaTagChange('cartão');
      component.adicionarTag();

      expect(component.tags()).toEqual(['cartão']);
      expect(spy).not.toHaveBeenCalled();
    });

    it('remove uma tag existente e emite o filtro', () => {
      component.onNovaTagChange('recorrente');
      component.adicionarTag();
      component.onNovaTagChange('cartão');
      component.adicionarTag();
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.removerTag('recorrente');

      expect(component.tags()).toEqual(['cartão']);
      expect(ultimoFiltroEmitido(spy).tags).toEqual(['cartão']);
    });

    it('adiciona a tag ao pressionar Enter no campo de tags', () => {
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);
      component.onNovaTagChange('viagem');

      component.onTagInputKeydown({ key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent);

      expect(component.tags()).toEqual(['viagem']);
      expect(ultimoFiltroEmitido(spy).tags).toEqual(['viagem']);
    });

    it('remove a última tag ao pressionar Backspace com o campo vazio', () => {
      component.onNovaTagChange('recorrente');
      component.adicionarTag();
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onTagInputKeydown({ key: 'Backspace', preventDefault: vi.fn() } as unknown as KeyboardEvent);

      expect(component.tags()).toEqual([]);
      expect(ultimoFiltroEmitido(spy).tags).toEqual([]);
    });

    it('não remove tag com Backspace quando o campo de texto não está vazio', () => {
      component.onNovaTagChange('recorrente');
      component.adicionarTag();
      component.onNovaTagChange('via');
      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.onTagInputKeydown({ key: 'Backspace', preventDefault: vi.fn() } as unknown as KeyboardEvent);

      expect(component.tags()).toEqual(['recorrente']);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('limparFiltros', () => {
    it('reseta todos os filtros e emite o filtro vazio', () => {
      component.onCompetenciaChange('Ago/2026');
      component.onCategoriaChange('Moradia');
      component.onStatusChange('Pago');
      component.onNovaTagChange('recorrente');
      component.adicionarTag();

      const spy = vi.fn();
      component.filtroAlterado.subscribe(spy);

      component.limparFiltros();

      expect(component.competencia()).toBe('');
      expect(component.categoria()).toBeUndefined();
      expect(component.status()).toBeUndefined();
      expect(component.tags()).toEqual([]);
      expect(component.novaTag()).toBe('');
      expect(ultimoFiltroEmitido(spy)).toEqual({
        competencia: '',
        categoria: undefined,
        status: undefined,
        tags: [],
      });
    });
  });
});
