import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PainelService } from '../../../core/services/painel.service';
import { AccountService } from '../../../core/services/account.service';
import { PainelPermissao, ResponsePainelDto } from '../../../core/models/painel.model';

interface TransacaoPlaceholder {
  descricao: string;
  autor: string;
  categoria: string;
  data: string;
  valor: number;
}

const PAPEL_INFO: Record<PainelPermissao, { label: string; classe: string }> = {
  [PainelPermissao.Dono]: { label: 'Dono', classe: 'badge-dono' },
  [PainelPermissao.Administrador]: { label: 'Adm', classe: 'badge-adm' },
  [PainelPermissao.Membro]: { label: 'Membro', classe: 'badge-membro' },
  [PainelPermissao.Visualizador]: { label: 'Visualizador', classe: 'badge-visualizador' },
};

const TRANSACOES_PLACEHOLDER: TransacaoPlaceholder[] = [
  { descricao: 'Salário', autor: 'Você', categoria: 'Renda', data: '2026-08-05', valor: 6500 },
  { descricao: 'Supermercado', autor: 'Você', categoria: 'Alimentação', data: '2026-08-08', valor: -420.5 },
  { descricao: 'Aluguel', autor: 'Você', categoria: 'Moradia', data: '2026-08-10', valor: -1800 },
  { descricao: 'Freelance', autor: 'Você', categoria: 'Renda extra', data: '2026-08-15', valor: 900 },
  { descricao: 'Internet', autor: 'Você', categoria: 'Contas', data: '2026-08-18', valor: -120 },
];

@Component({
  selector: 'app-painel-detalhe',
  standalone: false,
  styleUrl: './painel-detalhe.scss',
  templateUrl: './painel-detalhe.html',
})
export class PainelDetalhe implements OnInit {
  readonly painel = signal<ResponsePainelDto | undefined>(undefined);
  readonly carregando = signal(false);
  readonly erro = signal<string | undefined>(undefined);

  readonly transacoes = TRANSACOES_PLACEHOLDER;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly painelService: PainelService,
    private readonly accountService: AccountService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/paineis');
      return;
    }

    this.carregando.set(true);
    this.painelService.obterPainel(id).subscribe({
      next: (painel) => {
        this.painel.set(painel);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o painel.');
        this.carregando.set(false);
      },
    });
  }

  get papelDoUsuario(): { label: string; classe: string } | undefined {
    const painel = this.painel();
    if (!painel) {
      return undefined;
    }
    const usuarioAtualId = this.accountService.usuarioAtual?.id;
    const usuario = painel.usuarios?.find((u) => u.id === usuarioAtualId);
    const permissao = usuario?.idPermissao ?? PainelPermissao.Visualizador;
    return PAPEL_INFO[permissao];
  }

  get podeGerenciar(): boolean {
    const painel = this.painel();
    if (!painel) {
      return false;
    }
    const usuarioAtualId = this.accountService.usuarioAtual?.id;
    const usuario = painel.usuarios?.find((u) => u.id === usuarioAtualId);
    const permissao = usuario?.idPermissao ?? PainelPermissao.Visualizador;
    return permissao === PainelPermissao.Dono || permissao === PainelPermissao.Administrador;
  }

  get totalEntradas(): number {
    return this.transacoes.filter((t) => t.valor > 0).reduce((soma, t) => soma + t.valor, 0);
  }

  get totalSaidas(): number {
    return this.transacoes.filter((t) => t.valor < 0).reduce((soma, t) => soma + t.valor, 0);
  }

  get saldo(): number {
    return this.totalEntradas + this.totalSaidas;
  }

  iniciaisUsuario(firstName?: string, lastName?: string): string {
    const primeira = firstName?.charAt(0) ?? '';
    const segunda = lastName?.charAt(0) ?? '';
    return (primeira + segunda).toUpperCase() || '?';
  }

  voltar(): void {
    this.router.navigateByUrl('/paineis');
  }
}
