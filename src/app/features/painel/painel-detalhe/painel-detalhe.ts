import { Component, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PainelService } from '../../../core/services/painel.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { PainelPermissao, ResponsePainelDto } from '../../../core/models/painel.model';
import { Erro } from '../../../core/models/erro.model';

interface NavItem {
  icone: string;
  label: string;
  rota?: string;
  badge?: number;
  ativo?: boolean;
}

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
  @ViewChild('sidebarFooter') private readonly sidebarFooter?: ElementRef<HTMLElement>;

  readonly painel = signal<ResponsePainelDto | undefined>(undefined);
  readonly carregando = signal(false);
  readonly erro = signal<string | undefined>(undefined);

  readonly transacoes = TRANSACOES_PLACEHOLDER;

  menuUsuarioAberto = false;

  readonly renomearAberto = signal(false);
  readonly renomeando = signal(false);
  readonly erroRenomear = signal<string | undefined>(undefined);
  readonly renomearForm: FormGroup;

  readonly navItems: NavItem[] = [
    { icone: 'ti-layout-dashboard', label: 'Painéis', rota: '/paineis', ativo: true },
    { icone: 'ti-arrows-exchange', label: 'Transações' },
    { icone: 'ti-report-money', label: 'Relatórios' },
    { icone: 'ti-settings', label: 'Configurações' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly painelService: PainelService,
    private readonly accountService: AccountService,
    protected readonly authService: AuthService,
    private readonly fb: FormBuilder
  ) {
    this.renomearForm = this.fb.group({
      nome: ['', Validators.required]
    });
  }

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

  abrirRenomear(): void {
    const painel = this.painel();
    if (!painel) {
      return;
    }
    this.renomearForm.setValue({ nome: painel.nome ?? '' });
    this.erroRenomear.set(undefined);
    this.renomearAberto.set(true);
  }

  fecharRenomear(): void {
    this.renomearAberto.set(false);
  }

  salvarRenomear(): void {
    const painel = this.painel();
    if (!painel || this.renomearForm.invalid) {
      this.renomearForm.markAllAsTouched();
      return;
    }

    this.renomeando.set(true);
    this.erroRenomear.set(undefined);

    const { nome } = this.renomearForm.value;

    this.painelService.atualizarPainel({ id: painel.id, nome }).pipe(
      finalize(() => this.renomeando.set(false))
    ).subscribe({
      next: (painelAtualizado) => {
        this.painel.set(painelAtualizado);
        this.renomearAberto.set(false);
      },
      error: (error) => {
        const erros = (error?.error ?? []) as Erro[];
        this.erroRenomear.set(erros[0]?.descricao ?? 'Não foi possível renomear o painel. Tente novamente.');
      }
    });
  }

  irPara(item: NavItem): void {
    if (item.rota) {
      this.router.navigateByUrl(item.rota);
    }
  }

  get nomeUsuario(): string {
    const usuario = this.accountService.usuarioAtual;
    const nomeCadastrado = [usuario?.firstName, usuario?.lastName].filter(Boolean).join(' ').trim();
    return nomeCadastrado || this.authService.nomeUsuario || 'Usuário';
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
}
