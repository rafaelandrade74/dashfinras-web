import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { finalize, switchMap } from 'rxjs';
import { MovimentacaoFinanceiraService } from '../../../core/services/movimentacao-financeira.service';
import { TagService } from '../../../core/services/tag.service';
import { ResponseMovimentacaoDto, StatusMovimentacao } from '../../../core/models/movimentacao-financeira.model';
import { Erro } from '../../../core/models/erro.model';

/**
 * Ações por linha da tabela de lançamentos financeiros: marcar como pago, editar tags e
 * cancelar (exclusão lógica). Pensado para ser plugado na tela de listagem de movimentações
 * (task DFW-2) — cada linha da tabela instancia um `<app-movimentacao-acoes>` passando a
 * movimentação correspondente.
 */
@Component({
  selector: 'app-movimentacao-acoes',
  standalone: false,
  styleUrl: './movimentacao-acoes.scss',
  templateUrl: './movimentacao-acoes.html'
})
export class MovimentacaoAcoes {
  @Input({ required: true }) movimentacao!: ResponseMovimentacaoDto;

  /** Emitido após qualquer ação concluir com sucesso, com a movimentação já atualizada. */
  @Output() readonly alterada = new EventEmitter<ResponseMovimentacaoDto>();

  readonly StatusMovimentacao = StatusMovimentacao;

  // ===== Marcar como pago =====
  readonly pagarAberto = signal(false);
  readonly dataPagamento = signal<string>('');
  readonly marcandoPago = signal(false);
  readonly erroPagar = signal<string | undefined>(undefined);

  // ===== Editar tags =====
  readonly tagsAberto = signal(false);
  readonly tagsAtuais = signal<string[]>([]);
  readonly novaTag = signal('');
  readonly salvandoTags = signal(false);
  readonly erroTags = signal<string | undefined>(undefined);

  // ===== Cancelar =====
  readonly cancelarAberto = signal(false);
  readonly cancelando = signal(false);
  readonly erroCancelar = signal<string | undefined>(undefined);

  constructor(
    private readonly movimentacaoService: MovimentacaoFinanceiraService,
    private readonly tagService: TagService
  ) {}

  get jaPago(): boolean {
    return this.movimentacao?.status === StatusMovimentacao.Pago;
  }

  get jaCancelado(): boolean {
    return this.movimentacao?.ativo === false;
  }

  // ===== Marcar como pago =====

  abrirPagar(): void {
    this.erroPagar.set(undefined);
    this.dataPagamento.set(this.hojeIso());
    this.pagarAberto.set(true);
  }

  fecharPagar(): void {
    if (this.marcandoPago()) {
      return;
    }
    this.pagarAberto.set(false);
  }

  confirmarPagar(): void {
    if (!this.dataPagamento()) {
      this.erroPagar.set('Informe a data de pagamento.');
      return;
    }

    this.marcandoPago.set(true);
    this.erroPagar.set(undefined);

    this.movimentacaoService
      .marcarComoPago(this.movimentacao.id, this.dataPagamento())
      .pipe(finalize(() => this.marcandoPago.set(false)))
      .subscribe({
        next: (atualizada) => {
          this.pagarAberto.set(false);
          this.alterada.emit(atualizada);
        },
        error: (error) => {
          const erros = (error?.error ?? []) as Erro[];
          this.erroPagar.set(erros[0]?.descricao ?? 'Não foi possível marcar como pago. Tente novamente.');
        }
      });
  }

  private hojeIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ===== Editar tags =====

  abrirTags(): void {
    this.erroTags.set(undefined);
    this.novaTag.set('');
    this.tagsAberto.set(true);

    const idsAtuais = this.movimentacao.idsTags ?? [];
    if (idsAtuais.length === 0) {
      this.tagsAtuais.set([]);
      return;
    }

    // idsTags guarda os Guids reais das tags; a UI trabalha com nomes, então resolve
    // id -> nome buscando as tags do painel (de qualquer membro, não só quem criou) antes
    // de exibir os chips.
    this.tagService.listar(this.movimentacao.idPainel).subscribe({
      next: (tags) => {
        const nomePorId = new Map(tags.map((tag) => [tag.id, tag.nome]));
        this.tagsAtuais.set(idsAtuais.map((id) => nomePorId.get(id) ?? id));
      },
      error: () => this.tagsAtuais.set(idsAtuais)
    });
  }

  fecharTags(): void {
    if (this.salvandoTags()) {
      return;
    }
    this.tagsAberto.set(false);
  }

  adicionarTag(): void {
    const valor = this.novaTag().trim();
    if (!valor) {
      return;
    }
    if (this.tagsAtuais().some((tag) => tag.toLowerCase() === valor.toLowerCase())) {
      this.novaTag.set('');
      return;
    }
    this.tagsAtuais.update((tags) => [...tags, valor]);
    this.novaTag.set('');
  }

  removerTag(tag: string): void {
    this.tagsAtuais.update((tags) => tags.filter((t) => t !== tag));
  }

  salvarTags(): void {
    // Cobre o texto ainda digitado e não confirmado com Enter — o clique no botão já
    // deveria disparar o blur do input antes, mas isso garante mesmo se não disparar.
    this.adicionarTag();

    this.salvandoTags.set(true);
    this.erroTags.set(undefined);

    const nomesTags = this.tagsAtuais();

    this.movimentacaoService
      .associarTags(this.movimentacao.id, nomesTags)
      .pipe(
        // A API não retorna a movimentação atualizada nesse endpoint: resolve os nomes recém
        // salvos para os ids reais (a tag nova já existe no servidor a essa altura) para
        // reconstruir idsTags localmente antes de emitir `alterada`.
        switchMap(() => this.tagService.mapearIdsPorNome(nomesTags, this.movimentacao.idPainel)),
        finalize(() => this.salvandoTags.set(false))
      )
      .subscribe({
        next: (idsTags) => {
          // A API não retorna a movimentação atualizada nesta chamada (Observable<void>);
          // reconstrói localmente a partir dos ids resolvidos para refletir na UI.
          const atualizada: ResponseMovimentacaoDto = { ...this.movimentacao, idsTags };
          this.tagsAberto.set(false);
          this.alterada.emit(atualizada);
        },
        error: (error) => {
          const erros = (error?.error ?? []) as Erro[];
          this.erroTags.set(erros[0]?.descricao ?? 'Não foi possível salvar as tags. Tente novamente.');
        }
      });
  }

  // ===== Cancelar =====

  abrirCancelar(): void {
    this.erroCancelar.set(undefined);
    this.cancelarAberto.set(true);
  }

  fecharCancelar(): void {
    if (this.cancelando()) {
      return;
    }
    this.cancelarAberto.set(false);
  }

  confirmarCancelar(): void {
    this.cancelando.set(true);
    this.erroCancelar.set(undefined);

    this.movimentacaoService
      .cancelar(this.movimentacao.id)
      .pipe(finalize(() => this.cancelando.set(false)))
      .subscribe({
        next: () => {
          // A API não retorna a movimentação atualizada nesta chamada (Observable<void>);
          // reflete localmente o efeito da exclusão lógica (ativo = false).
          const atualizada: ResponseMovimentacaoDto = { ...this.movimentacao, ativo: false };
          this.cancelarAberto.set(false);
          this.alterada.emit(atualizada);
        },
        error: (error) => {
          const erros = (error?.error ?? []) as Erro[];
          this.erroCancelar.set(erros[0]?.descricao ?? 'Não foi possível cancelar essa movimentação. Tente novamente.');
        }
      });
  }
}
