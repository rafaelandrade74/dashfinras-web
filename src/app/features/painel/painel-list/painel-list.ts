import { Component, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PainelService } from '../../../core/services/painel.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { ResponsePainelDto } from '../../../core/models/painel.model';

interface KpiCard {
  label: string;
  valor: string;
  cor: 'teal' | 'danger' | 'ink';
  delta: string;
  deltaDirecao: 'up' | 'down';
}

interface BarraMes {
  mes: string;
  receita: number;
  despesa: number;
}

interface Orcamento {
  categoria: string;
  gasto: number;
  limite: number;
  status: 'ok' | 'no-limite' | 'estourado';
}

interface Transacao {
  descricao: string;
  categoria: string;
  data: string;
  valor: string;
  tipo: 'entrada' | 'saida';
  icone: string;
  corAvatar: string;
}

interface NavItem {
  icone: string;
  label: string;
  rota?: string;
  badge?: number;
  ativo?: boolean;
}

@Component({
  selector: 'app-painel-list',
  standalone: false,
  styleUrl: './painel-list.scss',
  templateUrl: './painel-list.html',
})
export class PainelList implements OnInit {
  @ViewChild('sidebarFooter') private readonly sidebarFooter?: ElementRef<HTMLElement>;

  readonly paineis = signal<ResponsePainelDto[]>([]);
  readonly carregando = signal(false);

  periodo: '7d' | 'mes' | 'ano' = 'mes';
  menuUsuarioAberto = false;

  readonly navItems: NavItem[] = [
    { icone: 'ti-layout-dashboard', label: 'Painel', ativo: true },
    { icone: 'ti-arrows-exchange', label: 'Transações' },
    { icone: 'ti-chart-pie', label: 'Orçamentos', badge: 2 },
    { icone: 'ti-target-arrow', label: 'Metas' },
    { icone: 'ti-report-money', label: 'Relatórios' },
    { icone: 'ti-settings', label: 'Configurações' },
  ];

  readonly kpis: KpiCard[] = [
    { label: 'Receitas', valor: 'R$ 8.420,00', cor: 'teal', delta: '+12,4%', deltaDirecao: 'up' },
    { label: 'Despesas', valor: 'R$ 5.180,50', cor: 'danger', delta: '+3,1%', deltaDirecao: 'up' },
    { label: 'Saldo', valor: 'R$ 3.239,50', cor: 'ink', delta: '+8,9%', deltaDirecao: 'up' },
    { label: 'Economia', valor: '38,5%', cor: 'ink', delta: '-2,0%', deltaDirecao: 'down' },
  ];

  readonly barras: BarraMes[] = [
    { mes: 'Mar', receita: 62, despesa: 44 },
    { mes: 'Abr', receita: 70, despesa: 50 },
    { mes: 'Mai', receita: 58, despesa: 46 },
    { mes: 'Jun', receita: 80, despesa: 52 },
    { mes: 'Jul', receita: 74, despesa: 60 },
    { mes: 'Ago', receita: 84, despesa: 51 },
  ];

  readonly orcamentos: Orcamento[] = [
    { categoria: 'Alimentação', gasto: 780, limite: 900, status: 'ok' },
    { categoria: 'Transporte', gasto: 410, limite: 450, status: 'no-limite' },
    { categoria: 'Lazer', gasto: 320, limite: 300, status: 'estourado' },
    { categoria: 'Moradia', gasto: 1500, limite: 1800, status: 'ok' },
    { categoria: 'Saúde', gasto: 210, limite: 400, status: 'ok' },
  ];

  readonly transacoes: Transacao[] = [
    { descricao: 'Salário', categoria: 'Renda', data: 'Hoje', valor: '+ R$ 5.200,00', tipo: 'entrada', icone: 'ti-briefcase', corAvatar: 'teal' },
    { descricao: 'Supermercado Pão de Açúcar', categoria: 'Alimentação', data: 'Ontem', valor: '- R$ 284,90', tipo: 'saida', icone: 'ti-shopping-cart', corAvatar: 'accent' },
    { descricao: 'Uber', categoria: 'Transporte', data: '21 ago', valor: '- R$ 32,40', tipo: 'saida', icone: 'ti-car', corAvatar: 'ink' },
    { descricao: 'Cinema', categoria: 'Lazer', data: '20 ago', valor: '- R$ 68,00', tipo: 'saida', icone: 'ti-movie', corAvatar: 'danger' },
    { descricao: 'Freelance design', categoria: 'Renda extra', data: '19 ago', valor: '+ R$ 900,00', tipo: 'entrada', icone: 'ti-palette', corAvatar: 'teal' },
  ];

  constructor(
    private readonly painelService: PainelService,
    private readonly accountService: AccountService,
    protected readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.carregarPaineis();
  }

  get nomeUsuario(): string {
    const usuario = this.accountService.usuarioAtual;
    const nomeCadastrado = [usuario?.firstName, usuario?.lastName].filter(Boolean).join(' ').trim();
    return nomeCadastrado || this.authService.nomeUsuario || 'Usuário';
  }

  carregarPaineis(): void {
    this.carregando.set(true);
    this.painelService.obterPaineisPaginado(1, 10).subscribe({
      next: (response) => {
        this.paineis.set(response.paineis ?? []);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
      }
    });
  }

  selecionarPeriodo(periodo: '7d' | 'mes' | 'ano'): void {
    this.periodo = periodo;
  }

  novoPainel(): void {
    this.router.navigateByUrl('/paineis/criar');
  }

  sair(): void {
    this.menuUsuarioAberto = false;
    this.authService.logout().then(() => this.router.navigateByUrl('/login'));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuUsuarioAberto && !this.sidebarFooter?.nativeElement.contains(event.target as Node)) {
      this.menuUsuarioAberto = false;
    }
  }

  barraMaxima(): number {
    return Math.max(...this.barras.flatMap((b) => [b.receita, b.despesa]));
  }

  orcamentoPercentual(orcamento: Orcamento): number {
    return Math.min(100, Math.round((orcamento.gasto / orcamento.limite) * 100));
  }
}
