import { Component, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PainelService } from '../../../core/services/painel.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { PainelPermissao, ResponsePainelDto } from '../../../core/models/painel.model';

interface NavItem {
  icone: string;
  label: string;
  rota?: string;
  badge?: number;
  ativo?: boolean;
}

const AVATAR_CORES = ['teal', 'accent', 'ink'] as const;

const PAPEL_INFO: Record<PainelPermissao, { label: string; classe: string }> = {
  [PainelPermissao.Dono]: { label: 'Dono', classe: 'badge-dono' },
  [PainelPermissao.Administrador]: { label: 'Adm', classe: 'badge-adm' },
  [PainelPermissao.Membro]: { label: 'Membro', classe: 'badge-membro' },
  [PainelPermissao.Visualizador]: { label: 'Visualizador', classe: 'badge-visualizador' },
};

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

  menuUsuarioAberto = false;

  readonly navItems: NavItem[] = [
    { icone: 'ti-layout-dashboard', label: 'Painéis', rota: '/paineis', ativo: true },
    { icone: 'ti-arrows-exchange', label: 'Transações' },
    { icone: 'ti-report-money', label: 'Relatórios' },
    { icone: 'ti-settings', label: 'Configurações' },
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

  papelDoUsuario(painel: ResponsePainelDto): { label: string; classe: string } {
    const usuarioAtualId = this.accountService.usuarioAtual?.id;
    const usuario = painel.usuarios?.find((u) => u.id === usuarioAtualId);
    const permissao = usuario?.idPermissao ?? PainelPermissao.Visualizador;
    return PAPEL_INFO[permissao];
  }

  membrosVisiveis(painel: ResponsePainelDto): { iniciais: string; cor: string }[] {
    return (painel.usuarios ?? []).slice(0, 3).map((usuario, indice) => ({
      iniciais: this.iniciais(usuario.firstName, usuario.lastName),
      cor: AVATAR_CORES[indice % AVATAR_CORES.length],
    }));
  }

  membrosOcultos(painel: ResponsePainelDto): number {
    return Math.max(0, (painel.usuarios?.length ?? 0) - 3);
  }

  private iniciais(firstName?: string, lastName?: string): string {
    const primeira = firstName?.charAt(0) ?? '';
    const segunda = lastName?.charAt(0) ?? '';
    return (primeira + segunda).toUpperCase() || '?';
  }

  novoPainel(): void {
    this.router.navigateByUrl('/paineis/criar');
  }

  abrirPainel(painel: ResponsePainelDto): void {
    this.router.navigateByUrl(`/paineis/${painel.id}`);
  }

  irPara(item: NavItem): void {
    if (item.rota) {
      this.router.navigateByUrl(item.rota);
    }
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
