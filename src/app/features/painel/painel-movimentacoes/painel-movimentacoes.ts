import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PainelService } from '../../../core/services/painel.service';
import { ResponsePainelDto } from '../../../core/models/painel.model';
import { MovimentacaoFinanceiraService } from '../../../core/services/movimentacao-financeira.service';
import {
  ResponseMovimentacaoDto,
  StatusMovimentacao as ApiStatusMovimentacao,
  TipoMovimentacao
} from '../../../core/models/movimentacao-financeira.model';

export type StatusMovimentacao = 'Pendente' | 'Pago';

export interface MovimentacaoFinanceiraItem {
  id: string;
  descricao: string;
  categoria: string;
  competencia: string; // formato MM/yyyy
  status: StatusMovimentacao;
  valor: number; // positivo = entrada, negativo = saída
}

const STATUS_INFO: Record<StatusMovimentacao, { label: string; classe: string }> = {
  Pago: { label: 'Pago', classe: 'status-pago' },
  Pendente: { label: 'Pendente', classe: 'status-pendente' }
};

const PAGE_SIZE = 10;

// Tamanho de página pedido à API (008-limite-consulta-movimentacoes) — o máximo permitido,
// pra preservar na prática o comportamento anterior (paginação só no cliente) na maioria dos
// painéis, mostrando um aviso em vez de truncar silenciosamente quando há mais do que isso.
const TAMANHO_PAGINA_API = 200;

/**
 * Converte a competência numérica da API (formato AAAAMM, ex.: 202608)
 * para o formato de exibição MM/yyyy usado pela tabela.
 */
function formatarCompetencia(competencia: number): string {
  const texto = String(competencia);
  if (texto.length !== 6) {
    return texto;
  }
  const ano = texto.slice(0, 4);
  const mes = texto.slice(4, 6);
  return `${mes}/${ano}`;
}

function mapearMovimentacao(dto: ResponseMovimentacaoDto): MovimentacaoFinanceiraItem {
  const valorComSinal = dto.tipo === TipoMovimentacao.Despesa ? -Math.abs(dto.valor) : Math.abs(dto.valor);

  return {
    id: dto.id,
    descricao: dto.observacao?.trim() || (dto.tipo === TipoMovimentacao.Receita ? 'Receita' : 'Despesa'),
    categoria: dto.idCategoria,
    competencia: formatarCompetencia(dto.competencia),
    status: dto.status === ApiStatusMovimentacao.Pago ? 'Pago' : 'Pendente',
    valor: valorComSinal
  };
}

@Component({
  selector: 'app-painel-movimentacoes',
  standalone: false,
  styleUrl: './painel-movimentacoes.scss',
  templateUrl: './painel-movimentacoes.html'
})
export class PainelMovimentacoes implements OnInit {
  readonly painel = signal<ResponsePainelDto | undefined>(undefined);

  readonly carregando = signal(false);
  readonly erro = signal<string | undefined>(undefined);
  readonly movimentacoes = signal<MovimentacaoFinanceiraItem[]>([]);

  readonly totalRegistros = signal(0);
  readonly temMaisNoServidor = signal(false);

  readonly paginaAtual = signal(1);
  readonly pageSize = PAGE_SIZE;

  readonly entradas = computed(() => this.movimentacoes().filter((m) => m.valor > 0));
  readonly saidas = computed(() => this.movimentacoes().filter((m) => m.valor < 0));

  readonly totalEntradas = computed(() => this.entradas().reduce((soma, m) => soma + m.valor, 0));
  readonly totalSaidas = computed(() => this.saidas().reduce((soma, m) => soma + m.valor, 0));
  readonly saldo = computed(() => this.totalEntradas() + this.totalSaidas());

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.movimentacoes().length / this.pageSize)));

  readonly movimentacoesPaginadas = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.pageSize;
    return this.movimentacoes().slice(inicio, inicio + this.pageSize);
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly painelService: PainelService,
    private readonly movimentacaoFinanceiraService: MovimentacaoFinanceiraService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/paineis');
      return;
    }

    this.carregarPainel(id);
    this.carregarMovimentacoes(id);
  }

  private carregarPainel(id: string): void {
    this.painelService.obterPainel(id).subscribe({
      next: (painel) => this.painel.set(painel),
      error: () => {
        // O nome do painel é só contexto visual no topo da tela; se falhar,
        // a tela de movimentações continua funcional com os dados mockados.
      }
    });
  }

  private carregarMovimentacoes(idPainel: string): void {
    this.carregando.set(true);
    this.erro.set(undefined);

    this.movimentacaoFinanceiraService
      .consultar({ idPainel, pagina: 1, tamanhoPagina: TAMANHO_PAGINA_API })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (resposta) => {
          this.movimentacoes.set(resposta.movimentacoes.map(mapearMovimentacao));
          this.totalRegistros.set(resposta.totalRegistros);
          this.temMaisNoServidor.set(resposta.temProximaPagina);
          this.paginaAtual.set(1);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os lançamentos. Tente novamente.');
        }
      });
  }

  statusInfo(status: StatusMovimentacao): { label: string; classe: string } {
    return STATUS_INFO[status];
  }

  classeValor(valor: number): string {
    return valor >= 0 ? 'valor-receita' : 'valor-despesa';
  }

  paginaAnterior(): void {
    if (this.paginaAtual() > 1) {
      this.paginaAtual.update((pagina) => pagina - 1);
    }
  }

  proximaPagina(): void {
    if (this.paginaAtual() < this.totalPaginas()) {
      this.paginaAtual.update((pagina) => pagina + 1);
    }
  }

  voltar(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.router.navigateByUrl(id ? `/paineis/${id}` : '/paineis');
  }
}
