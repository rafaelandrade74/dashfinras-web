import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ResponseMovimentacaoDto, StatusMovimentacao } from '../../../core/models/movimentacao-financeira.model';
import { MovimentacaoAcoes } from './movimentacao-acoes';

describe('MovimentacaoAcoes', () => {
  let component: MovimentacaoAcoes;
  let fixture: ComponentFixture<MovimentacaoAcoes>;
  let httpMock: HttpTestingController;

  function movimentacao(overrides: Partial<ResponseMovimentacaoDto> = {}): ResponseMovimentacaoDto {
    return {
      id: 'mov-1',
      idPainel: 'painel-1',
      tipo: 0,
      idCategoria: 'cat-1',
      competencia: 202608,
      valor: 2200,
      status: StatusMovimentacao.Pendente,
      observacao: 'Aluguel',
      tags: [{ id: 'tag-recorrente', nome: 'recorrente' }],
      ativo: true,
      criadoPor: 'user-1',
      criadoEm: '2026-08-01T00:00:00Z',
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

  function definir(mov: ResponseMovimentacaoDto): void {
    component.movimentacao = mov;
    fixture.detectChanges();
  }

  describe('exibição condicional', () => {
    it('mostra o botão de marcar como pago quando pendente', () => {
      definir(movimentacao({ status: StatusMovimentacao.Pendente }));
      expect(component.jaPago).toBe(false);

      const botoes = fixture.nativeElement.querySelectorAll('[title="Marcar como pago"]');
      expect(botoes.length).toBe(1);
    });

    it('esconde o botão de marcar como pago quando já pago', () => {
      definir(movimentacao({ status: StatusMovimentacao.Pago }));
      expect(component.jaPago).toBe(true);

      const botoes = fixture.nativeElement.querySelectorAll('[title="Marcar como pago"]');
      expect(botoes.length).toBe(0);
    });

    it('esconde todas as ações quando cancelada/inativa', () => {
      definir(movimentacao({ ativo: false }));
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
      httpMock.expectNone(`/api/movimentacoes-financeiras/${component.movimentacao.id}/marcar-como-pago`);
    });

    it('em sucesso, chama o service, fecha o modal e emite a movimentação atualizada', () => {
      component.abrirPagar();
      component.dataPagamento.set('2026-08-20');

      const emitida = vi.fn();
      component.alterada.subscribe(emitida);

      component.confirmarPagar();

      const req = httpMock.expectOne(`/api/movimentacoes-financeiras/${component.movimentacao.id}/marcar-como-pago`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ dataPagamento: '2026-08-20' });

      const atualizada = movimentacao({ status: StatusMovimentacao.Pago, dataPagamento: '2026-08-20' });
      req.flush(atualizada);

      expect(component.pagarAberto()).toBe(false);
      expect(component.marcandoPago()).toBe(false);
      expect(emitida).toHaveBeenCalledWith(atualizada);
    });

    it('em erro da API, mantém o modal aberto e exibe a mensagem', () => {
      component.abrirPagar();
      component.dataPagamento.set('2026-08-20');
      component.confirmarPagar();

      const req = httpMock.expectOne(`/api/movimentacoes-financeiras/${component.movimentacao.id}/marcar-como-pago`);
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
    beforeEach(() => definir(movimentacao({ tags: [{ id: 'tag-recorrente', nome: 'recorrente' }] })));

    it('abre o modal com uma cópia dos nomes das tags atuais', () => {
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

    it('em sucesso, chama o service com idsTags, fecha o modal e emite a movimentação atualizada', () => {
      component.abrirTags();
      component.removerTag('recorrente');
      component.novaTag.set('cartão');
      component.adicionarTag();

      const emitida = vi.fn();
      component.alterada.subscribe(emitida);

      component.salvarTags();

      const req = httpMock.expectOne(`/api/movimentacoes-financeiras/${component.movimentacao.id}/tags`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ idsTags: ['cartão'] });

      req.flush(null);

      expect(component.tagsAberto()).toBe(false);
      expect(emitida).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [{ id: 'cartão', nome: 'cartão' }] })
      );
    });

    it('em erro da API, mantém o modal aberto e exibe a mensagem', () => {
      component.abrirTags();
      component.salvarTags();

      const req = httpMock.expectOne(`/api/movimentacoes-financeiras/${component.movimentacao.id}/tags`);
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

    it('em sucesso, chama o service (DELETE), fecha o modal e emite a movimentação atualizada como inativa', () => {
      component.abrirCancelar();

      const emitida = vi.fn();
      component.alterada.subscribe(emitida);

      component.confirmarCancelar();

      const req = httpMock.expectOne(`/api/movimentacoes-financeiras/${component.movimentacao.id}`);
      expect(req.request.method).toBe('DELETE');

      req.flush(null);

      expect(component.cancelarAberto()).toBe(false);
      expect(emitida).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
    });

    it('em erro da API, mantém o modal aberto e exibe a mensagem', () => {
      component.abrirCancelar();
      component.confirmarCancelar();

      const req = httpMock.expectOne(`/api/movimentacoes-financeiras/${component.movimentacao.id}`);
      req.flush([{ descricao: 'Não foi possível cancelar agora.' }], { status: 500, statusText: 'Server Error' });

      expect(component.cancelarAberto()).toBe(true);
      expect(component.erroCancelar()).toBe('Não foi possível cancelar agora.');
      expect(component.cancelando()).toBe(false);
    });
  });
});
