import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, of } from 'rxjs';
import { PainelService } from '../../../core/services/painel.service';
import { ResponsePainelDto } from '../../../core/models/painel.model';

/**
 * TODO(DFW-1): trocar os dados mockados abaixo pela chamada real ao
 * MovimentacaoFinanceiraService assim que o service (e o endpoint no
 * backend) estiverem disponíveis. Ver ConsultarAsync/ObterAgregacaoAsync
 * no MovimentacaoFinanceiraService da API.
 */
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

function gerarMovimentacoesMock(): MovimentacaoFinanceiraItem[] {
  const base: Omit<MovimentacaoFinanceiraItem, 'id'>[] = [
    { descricao: 'Salário', categoria: 'Salário', competencia: '08/2026', status: 'Pago', valor: 6500 },
    { descricao: 'Aluguel', categoria: 'Moradia', competencia: '08/2026', status: 'Pendente', valor: -2200 },
    { descricao: 'Supermercado', categoria: 'Alimentação', competencia: '08/2026', status: 'Pendente', valor: -640.15 },
    { descricao: 'Freelance', categoria: 'Salário', competencia: '08/2026', status: 'Pago', valor: 1900 },
    { descricao: 'Internet', categoria: 'Contas', competencia: '08/2026', status: 'Pago', valor: -120 },
    { descricao: 'Academia', categoria: 'Saúde', competencia: '08/2026', status: 'Pendente', valor: -99.9 },
    { descricao: 'Energia elétrica', categoria: 'Contas', competencia: '08/2026', status: 'Pago', valor: -210.4 },
    { descricao: 'Dividendos', categoria: 'Investimentos', competencia: '08/2026', status: 'Pago', valor: 350 },
    { descricao: 'Transporte por app', categoria: 'Transporte', competencia: '08/2026', status: 'Pendente', valor: -85.6 },
    { descricao: 'Restaurante', categoria: 'Alimentação', competencia: '08/2026', status: 'Pago', valor: -138 },
    { descricao: 'Streaming', categoria: 'Lazer', competencia: '08/2026', status: 'Pago', valor: -39.9 },
    { descricao: 'Consultoria', categoria: 'Renda extra', competencia: '07/2026', status: 'Pago', valor: 1200 },
    { descricao: 'Plano de saúde', categoria: 'Saúde', competencia: '08/2026', status: 'Pendente', valor: -450 },
    { descricao: 'Combustível', categoria: 'Transporte', competencia: '08/2026', status: 'Pago', valor: -260 },
    { descricao: 'Farmácia', categoria: 'Saúde', competencia: '08/2026', status: 'Pago', valor: -74.3 },
    { descricao: 'Curso online', categoria: 'Educação', competencia: '08/2026', status: 'Pendente', valor: -199 },
    { descricao: 'Cashback cartão', categoria: 'Investimentos', competencia: '08/2026', status: 'Pago', valor: 45.2 },
    { descricao: 'Presente aniversário', categoria: 'Lazer', competencia: '08/2026', status: 'Pago', valor: -180 },
    { descricao: 'Condomínio', categoria: 'Moradia', competencia: '08/2026', status: 'Pendente', valor: -520 },
    { descricao: 'Venda item usado', categoria: 'Renda extra', competencia: '08/2026', status: 'Pago', valor: 300 },
    { descricao: 'Assinatura revista', categoria: 'Lazer', competencia: '08/2026', status: 'Pago', valor: -29.9 },
    { descricao: 'Manutenção carro', categoria: 'Transporte', competencia: '07/2026', status: 'Pago', valor: -340 }
  ];

  return base.map((item, indice) => ({ id: `mov-${indice + 1}`, ...item }));
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
    private readonly painelService: PainelService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/paineis');
      return;
    }

    this.carregarPainel(id);
    this.carregarMovimentacoes();
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

  private carregarMovimentacoes(): void {
    this.carregando.set(true);
    this.erro.set(undefined);

    // TODO(DFW-1): substituir por this.movimentacaoFinanceiraService.consultar(...)
    of(gerarMovimentacoesMock())
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: (dados) => {
          this.movimentacoes.set(dados);
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
