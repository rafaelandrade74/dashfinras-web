import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  MovimentacaoFinanceiraDto,
  StatusMovimentacaoFinanceira
} from '../../../core/models/movimentacao-financeira.model';
import { MovimentacaoAcoes } from './movimentacao-acoes';

describe('MovimentacaoAcoes', () => {
  let component: MovimentacaoAcoes;
  let fixture: ComponentFixture<MovimentacaoAcoes>;
  let httpMock: HttpTestingController;

  function movimentacao(overrides: Partial<MovimentacaoFinanceiraDto> = {}): MovimentacaoFinanceiraDto {
    return {
      id: 'mov-1',
      idPainel: 'painel-1',
      descricao: 'Aluguel',
      categoria: 'Moradia',
      competencia: '08/2026',
      valor: -2200,
      status: StatusMovimentacaoFinanceira.Pendente,
      tags: ['recorrente'],
      ativo: true,
      ...overrides
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MovimentacaoAcoes],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(MovimentacaoAcoes);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function definir(mov: MovimentacaoFinanceiraDto): void {
    component.movimentacao = mov;
    fixture.detectChanges();
  }

  describe('exibição condicional', () => {
    it('mostra o botão de marcar como pago quando pendente', () => {
      definir(movimentacao({ status: StatusMovimentacaoFinanceira.Pendente }));
      expect(component.jaPago).toBe(false);

      const botoes = fixture.nativeElement.querySelectorAll('[title="Marcar como pago"]');
      expect(botoes.length).toBe(1);
    });

    it('esconde o botão de marcar como pago quando já pago', () => {
      definir(movimentacao({ status: StatusMovimentacaoFinanceira.Pago }));
      expect(component.jaPago).toBe(true);

      const botoes = fixture.nativeElement.querySelectorAll('[title="Marcar como pago"]');
      expect(botoes.length).toBe(0);
    });

    it('esconde todas as ações quando cancelada/inativa', () => {
      definir(movimentacao({ status: StatusMovimentacaoFinanceira.Cancelado, ativo: false }));
      expect(component.jaCancelado).toBe(true);

      expect(fixture.nativeElement.querySelectorAll('.btn-icone').length).toBe(0);
    });
  });

  describe('marcar como pago', () => {
    beforeEach(() => definir(movimentacao()));

    it('abre o modal preenchendo a data de hoje', () => {
      component.abrirPagar();
      expect(component.pagarAberto()).toBe(true);
      expect(component.dataPagamento()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('exige a data de pagamento antes de confirmar', () => {
      component.abrirPagar();
      component.dataPagamento.set('');
      component.confirmarPagar();
      expect(component.erroPagar()).toBe('Informe a data de pagamento.');
      httpMock.expectNone(`/api/movimentacao-financeira/${component.movimentacao.id}/marcar-como-pago`);
    });

    it('em sucesso, chama o service, fecha o modal e emite a movimentação atualizada', () => {
      component.abrirPagar();
      component.dataPagamento.set('2026-08-20');

      const emitida = vi.fn();
      component.alterada.subscribe(emitida);

      component.confirmarPagar();

      const req = httpMock.expectOne(`/api/movimentacao-financeira/${component.movimentacao.id}/marcar-como-pago`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ dataPagamento: '2026-08-20' });

      const atualizada = movimentacao({ status: StatusMovimentacaoFinanceira.Pago, dataPagamento: '2026-08-20' });
      req.flush(atualizada);

      expect(component.pagarAberto()).toBe(false);
      expect(component.marcandoPago()).toBe(false);
      expect(emitida).toHaveBeenCalledWith(atualizada);
    });

    it('em erro da API, mantém o modal aberto e exibe a mensagem', () => {
      component.abrirPagar();
      component.dataPagamento.set('2026-08-20');
      component.confirmarPagar();

      const req = httpMock.expectOne(`/api/movimentacao-financeira/${component.movimentacao.id}/marcar-como-pago`);
      req.flush([{ descricao: 'Movimentação já paga.' }], { status: 400, statusText: 'Bad Request' });

      expect(component.pagarAberto()).toBe(true);
      expect(component.erroPagar()).toBe('Movimentação já paga.');
      expect(component.marcandoPago()).toBe(false);
    });

    it('não fecha o modal enquanto está salvando', () => {
      component.abrirPagar();
      component.marcandoPago.set(true);
      component.fecharPagar();
      expect(component.pagarAberto()).toBe(true);
    });
  });

  describe('editar tags', () => {
    beforeEach(() => definir(movimentacao({ tags: ['recorrente'] })));

    it('abre o modal com uma cópia das tags atuais', () => {
      component.abrirTags();
      expect(component.tagsAberto()).toBe(true);
      expect(component.tagsAtuais()).toEqual(['recorrente']);
    });

    it('adiciona uma nova tag sem duplicar (case-insensitive) e ignora vazio', () => {
      component.abrirTags();
      component.novaTag.set('  cartão ');
      component.adicionarTag();
      expect(component.tagsAtuais()).toEqual(['recorrente', 'cartão']);
      expect(component.novaTag()).toBe('');

      component.novaTag.set('RECORRENTE');
      component.adicionarTag();
      expect(component.tagsAtuais()).toEqual(['recorrente', 'cartão']);

      component.novaTag.set('   ');
      component.adicionarTag();
      expect(component.tagsAtuais()).toEqual(['recorrente', 'cartão']);
    });

    it('remove uma tag da lista local', () => {
      component.abrirTags();
      component.removerTag('recorrente');
      expect(component.tagsAtuais()).toEqual([]);
    });

    it('em sucesso, chama o service com as tags atuais, fecha o modal e emite a movimentação atualizada', () => {
      component.abrirTags();
      component.removerTag('recorrente');
      component.novaTag.set('cartão');
      component.adicionarTag();

      const emitida = vi.fn();
      component.alterada.subscribe(emitida);

      component.salvarTags();

      const req = httpMock.expectOne(`/api/movimentacao-financeira/${component.movimentacao.id}/tags`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ tags: ['cartão'] });

      const atualizada = movimentacao({ tags: ['cartão'] });
      req.flush(atualizada);

      expect(component.tagsAberto()).toBe(false);
      expect(emitida).toHaveBeenCalledWith(atualizada);
    });

    it('em erro da API, mantém o modal aberto e exibe a mensagem', () => {
      component.abrirTags();
      component.salvarTags();

      const req = httpMock.expectOne(`/api/movimentacao-financeira/${component.movimentacao.id}/tags`);
      req.flush([{ descricao: 'Não foi possível salvar as tags agora.' }], { status: 500, statusText: 'Server Error' });

      expect(component.tagsAberto()).toBe(true);
      expect(component.erroTags()).toBe('Não foi possível salvar as tags agora.');
    });
  });

  describe('cancelar', () => {
    beforeEach(() => definir(movimentacao()));

    it('abre e fecha o modal de confirmação', () => {
      component.abrirCancelar();
      expect(component.cancelarAberto()).toBe(true);
      component.fecharCancelar();
      expect(component.cancelarAberto()).toBe(false);
    });

    it('não fecha o modal enquanto está cancelando', () => {
      component.abrirCancelar();
      component.cancelando.set(true);
      component.fecharCancelar();
      expect(component.cancelarAberto()).toBe(true);
    });

    it('em sucesso, chama o service (DELETE), fecha o modal e emite a movimentação atualizada', () => {
      component.abrirCancelar();

      const emitida = vi.fn();
      component.alterada.subscribe(emitida);

      component.confirmarCancelar();

      const req = httpMock.expectOne(`/api/movimentacao-financeira/${component.movimentacao.id}`);
      expect(req.request.method).toBe('DELETE');

      const atualizada = movimentacao({ status: StatusMovimentacaoFinanceira.Cancelado, ativo: false });
      req.flush(atualizada);

      expect(component.cancelarAberto()).toBe(false);
      expect(emitida).toHaveBeenCalledWith(atualizada);
    });

    it('em erro da API, mantém o modal aberto e exibe a mensagem', () => {
      component.abrirCancelar();
      component.confirmarCancelar();

      const req = httpMock.expectOne(`/api/movimentacao-financeira/${component.movimentacao.id}`);
      req.flush([{ descricao: 'Não foi possível cancelar agora.' }], { status: 500, statusText: 'Server Error' });

      expect(component.cancelarAberto()).toBe(true);
      expect(component.erroCancelar()).toBe('Não foi possível cancelar agora.');
      expect(component.cancelando()).toBe(false);
    });
  });
});
