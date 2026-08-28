import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RegistrarMovimentacaoModal, competenciaParaInteiro } from './registrar-movimentacao-modal';
import { TipoMovimentacao } from '../../../core/models/movimentacao-financeira.model';

describe('RegistrarMovimentacaoModal', () => {
  let component: RegistrarMovimentacaoModal;
  let fixture: ComponentFixture<RegistrarMovimentacaoModal>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [RegistrarMovimentacaoModal],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarMovimentacaoModal);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    component.idPainel = 'painel-1';
    component.nomePainel = 'Casa';
    component.categorias = [
      { id: 'cat-1', nome: 'Moradia' },
      { id: 'cat-2', nome: 'Alimentação' }
    ];
  });

  afterEach(() => {
    httpMock.verify();
  });

  function abrirModal(): void {
    component.aberto = true;
    component.ngOnChanges({ aberto: {} as any });
    fixture.detectChanges();
  }

  function preencherFormularioValido(): void {
    component.form.setValue({
      tipo: TipoMovimentacao.Despesa,
      valor: '150,00',
      competencia: '08/2026',
      idCategoria: 'cat-1',
      tags: [],
      observacao: ''
    });
  }

  describe('competenciaParaInteiro', () => {
    it('converte MM/AAAA para o inteiro yyyyMM esperado pela API', () => {
      expect(competenciaParaInteiro('08/2026')).toBe(202608);
      expect(competenciaParaInteiro('01/2000')).toBe(200001);
      expect(competenciaParaInteiro('12/2099')).toBe(209912);
    });
  });

  describe('validação de formulário', () => {
    it('bloqueia submissão e exibe erro quando a competência é inválida (mês fora de 01-12)', () => {
      abrirModal();
      preencherFormularioValido();
      component.form.controls['competencia'].setValue('13/2026');

      component.registrar();

      expect(component.form.controls['competencia'].invalid).toBe(true);
      expect(component.form.controls['competencia'].errors).toEqual({ competenciaInvalida: true });
      httpMock.expectNone(() => true);
    });

    it('bloqueia submissão quando a competência não tem o formato esperado', () => {
      abrirModal();
      preencherFormularioValido();
      component.form.controls['competencia'].setValue('agosto/2026');

      component.registrar();

      expect(component.form.controls['competencia'].invalid).toBe(true);
      httpMock.expectNone(() => true);
    });

    it('bloqueia submissão e exibe erro quando o valor não é maior que zero', () => {
      abrirModal();
      preencherFormularioValido();
      component.form.controls['valor'].setValue('0');

      component.registrar();

      expect(component.form.controls['valor'].invalid).toBe(true);
      expect(component.form.controls['valor'].errors).toEqual({ valorInvalido: true });
      httpMock.expectNone(() => true);
    });

    it('bloqueia submissão quando o valor é negativo', () => {
      abrirModal();
      preencherFormularioValido();
      component.form.controls['valor'].setValue('-10');

      component.registrar();

      expect(component.form.controls['valor'].invalid).toBe(true);
      httpMock.expectNone(() => true);
    });

    it('bloqueia submissão quando nenhuma categoria é selecionada', () => {
      abrirModal();
      preencherFormularioValido();
      component.form.controls['idCategoria'].setValue('');

      component.registrar();

      expect(component.form.controls['idCategoria'].invalid).toBe(true);
      httpMock.expectNone(() => true);
    });

    it('marca todos os campos como touched ao tentar submeter um formulário inválido', () => {
      abrirModal();

      component.registrar();

      expect(component.form.controls['valor'].touched).toBe(true);
      expect(component.form.controls['competencia'].touched).toBe(true);
      expect(component.form.controls['idCategoria'].touched).toBe(true);
    });
  });

  describe('toggle de tipo', () => {
    it('inicia com Despesa selecionado por padrão', () => {
      abrirModal();
      expect(component.form.controls['tipo'].value).toBe(TipoMovimentacao.Despesa);
    });

    it('alterna para Receita ao selecionar', () => {
      abrirModal();
      component.selecionarTipo(TipoMovimentacao.Receita);
      expect(component.form.controls['tipo'].value).toBe(TipoMovimentacao.Receita);
    });

    it('alterna de volta para Despesa', () => {
      abrirModal();
      component.selecionarTipo(TipoMovimentacao.Receita);
      component.selecionarTipo(TipoMovimentacao.Despesa);
      expect(component.form.controls['tipo'].value).toBe(TipoMovimentacao.Despesa);
    });
  });

  describe('tags (chips)', () => {
    it('adiciona uma tag a partir do input e limpa o campo', () => {
      abrirModal();
      const input = document.createElement('input');
      input.value = 'recorrente';

      component.adicionarTag(input);

      expect(component.tags).toEqual(['recorrente']);
      expect(input.value).toBe('');
    });

    it('não adiciona tag vazia nem duplicada', () => {
      abrirModal();
      const input = document.createElement('input');
      input.value = 'recorrente';
      component.adicionarTag(input);

      input.value = 'recorrente';
      component.adicionarTag(input);

      input.value = '   ';
      component.adicionarTag(input);

      expect(component.tags).toEqual(['recorrente']);
    });

    it('remove uma tag existente', () => {
      abrirModal();
      const input = document.createElement('input');
      input.value = 'recorrente';
      component.adicionarTag(input);

      component.removerTag('recorrente');

      expect(component.tags).toEqual([]);
    });
  });

  describe('submissão', () => {
    it('registra com sucesso, converte competência/valor e fecha o modal', () => {
      abrirModal();
      preencherFormularioValido();
      let fechou = false;
      let registrou = false;
      component.fechar.subscribe(() => (fechou = true));
      component.registrado.subscribe(() => (registrou = true));

      component.registrar();

      expect(component.registrando()).toBe(true);
      const req = httpMock.expectOne('/api/movimentacoes-financeiras');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        idPainel: 'painel-1',
        tipo: TipoMovimentacao.Despesa,
        idCategoria: 'cat-1',
        competencia: 202608,
        valor: 150,
        observacao: undefined
      });

      req.flush({ id: 'mov-1' });

      expect(component.registrando()).toBe(false);
      expect(registrou).toBe(true);
      expect(fechou).toBe(true);
    });

    it('em caso de erro da API, mostra mensagem e mantém o modal aberto', () => {
      abrirModal();
      preencherFormularioValido();
      let fechou = false;
      component.fechar.subscribe(() => (fechou = true));

      component.registrar();

      const req = httpMock.expectOne('/api/movimentacoes-financeiras');
      req.flush([{ codigo: 'MOVIMENTACAO_INVALIDA', descricao: 'Não foi possível registrar.' }], {
        status: 400,
        statusText: 'Bad Request'
      });

      expect(component.registrando()).toBe(false);
      expect(component.erroApi()).toBe('Não foi possível registrar.');
      expect(fechou).toBe(false);
      expect(component.aberto).toBe(true);
    });

    it('usa mensagem padrão quando a API não retorna descrição do erro', () => {
      abrirModal();
      preencherFormularioValido();

      component.registrar();

      const req = httpMock.expectOne('/api/movimentacoes-financeiras');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(component.erroApi()).toBe('Não foi possível registrar a movimentação. Tente novamente.');
    });

    it('envia observação e associa as tags após registrar com sucesso', () => {
      abrirModal();
      preencherFormularioValido();
      component.form.controls['tags'].setValue(['tag-1', 'tag-2']);
      component.form.controls['observacao'].setValue('  parcela 3 de 6  ');

      component.registrar();

      const req = httpMock.expectOne('/api/movimentacoes-financeiras');
      expect(req.request.body.observacao).toBe('parcela 3 de 6');
      req.flush({ id: 'mov-1' });

      const reqTags = httpMock.expectOne('/api/movimentacoes-financeiras/mov-1/tags');
      expect(reqTags.request.method).toBe('PUT');
      expect(reqTags.request.body).toEqual({ idsTags: ['tag-1', 'tag-2'] });
      reqTags.flush(null);
    });

    it('não submete quando idPainel não está definido', () => {
      abrirModal();
      preencherFormularioValido();
      component.idPainel = undefined;

      component.registrar();

      httpMock.expectNone(() => true);
    });
  });

  describe('fechar / resetar', () => {
    it('reseta o formulário para os valores padrão sempre que reaberto', () => {
      abrirModal();
      component.form.controls['valor'].setValue('300');
      component.selecionarTipo(TipoMovimentacao.Receita);

      component.aberto = false;
      fixture.detectChanges();
      abrirModal();

      expect(component.form.controls['valor'].value).toBe('');
      expect(component.form.controls['tipo'].value).toBe(TipoMovimentacao.Despesa);
      expect(component.tags).toEqual([]);
    });

    it('não fecha o modal enquanto está registrando', () => {
      abrirModal();
      component.registrando.set(true);
      let fechou = false;
      component.fechar.subscribe(() => (fechou = true));

      component.fecharModal();

      expect(fechou).toBe(false);
    });

    it('fecha o modal via botão cancelar quando não está registrando', () => {
      abrirModal();
      let fechou = false;
      component.fechar.subscribe(() => (fechou = true));

      component.fecharModal();

      expect(fechou).toBe(true);
    });
  });
});
