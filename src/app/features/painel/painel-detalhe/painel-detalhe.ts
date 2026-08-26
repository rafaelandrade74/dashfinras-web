import { Component, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PainelService } from '../../../core/services/painel.service';
import { ConviteService } from '../../../core/services/convite.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { PainelPermissao, ResponsePainelDto } from '../../../core/models/painel.model';
import { ResponseConviteDto, StatusConvite } from '../../../core/models/convite.model';
import { Erro } from '../../../core/models/erro.model';
import { PAPEIS_CONVITE } from '../painel-criar/painel-criar';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const STATUS_INFO: Record<StatusConvite, { label: string; classe: string }> = {
  [StatusConvite.PendenteCadastro]: { label: 'Pendente', classe: 'status-pendente' },
  [StatusConvite.PendenteAprovacao]: { label: 'Pendente', classe: 'status-pendente' },
  [StatusConvite.Concluido]: { label: 'Aceito', classe: 'status-aceito' },
  [StatusConvite.Recusado]: { label: 'Recusado', classe: 'status-recusado' },
  [StatusConvite.Expirado]: { label: 'Expirado', classe: 'status-expirado' },
  [StatusConvite.Invalidado]: { label: 'Invalidado', classe: 'status-expirado' },
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
  @ViewChild('menuAcoes') private readonly menuAcoes?: ElementRef<HTMLElement>;

  readonly painel = signal<ResponsePainelDto | undefined>(undefined);
  readonly carregando = signal(false);
  readonly erro = signal<string | undefined>(undefined);

  readonly transacoes = TRANSACOES_PLACEHOLDER;

  menuUsuarioAberto = false;
  menuAcoesAberto = false;

  readonly renomearAberto = signal(false);
  readonly renomeando = signal(false);
  readonly erroRenomear = signal<string | undefined>(undefined);
  readonly renomearForm: FormGroup;

  readonly excluirAberto = signal(false);
  readonly excluindo = signal(false);
  readonly erroExcluir = signal<string | undefined>(undefined);

  readonly usuariosAberto = signal(false);
  readonly adicionandoUsuario = signal(false);
  readonly erroAdicionarUsuario = signal<string | undefined>(undefined);
  readonly avisoAdicionarUsuario = signal<string | undefined>(undefined);
  readonly adicionarUsuarioForm: FormGroup;
  readonly papeis = PAPEIS_CONVITE;

  readonly usuariosAba = signal<'usuarios' | 'convites'>('usuarios');
  readonly convites = signal<ResponseConviteDto[]>([]);
  readonly convitesCarregados = signal(false);
  readonly carregandoConvites = signal(false);
  readonly erroConvites = signal<string | undefined>(undefined);
  readonly reenviandoConviteId = signal<string | undefined>(undefined);

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
    private readonly conviteService: ConviteService,
    private readonly accountService: AccountService,
    protected readonly authService: AuthService,
    private readonly fb: FormBuilder
  ) {
    this.renomearForm = this.fb.group({
      nome: ['', Validators.required]
    });
    this.adicionarUsuarioForm = this.fb.group({
      email: [''],
      permissao: [PainelPermissao.Membro]
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

  get podeExcluir(): boolean {
    const painel = this.painel();
    if (!painel) {
      return false;
    }
    const usuarioAtualId = this.accountService.usuarioAtual?.id;
    const usuario = painel.usuarios?.find((u) => u.id === usuarioAtualId);
    const permissao = usuario?.idPermissao ?? PainelPermissao.Visualizador;
    return permissao === PainelPermissao.Dono;
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

  abrirExcluir(): void {
    this.menuAcoesAberto = false;
    this.erroExcluir.set(undefined);
    this.excluirAberto.set(true);
  }

  fecharExcluir(): void {
    this.excluirAberto.set(false);
  }

  confirmarExcluir(): void {
    const painel = this.painel();
    if (!painel) {
      return;
    }

    this.excluindo.set(true);
    this.erroExcluir.set(undefined);

    this.painelService.deletarPainel(painel.id).pipe(
      finalize(() => this.excluindo.set(false))
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/paineis');
      },
      error: (error) => {
        const erros = (error?.error ?? []) as Erro[];
        this.erroExcluir.set(erros[0]?.descricao ?? 'Não foi possível excluir o painel. Tente novamente.');
      }
    });
  }

  abrirUsuarios(): void {
    this.erroAdicionarUsuario.set(undefined);
    this.avisoAdicionarUsuario.set(undefined);
    this.adicionarUsuarioForm.reset({ email: '', permissao: PainelPermissao.Membro });
    this.usuariosAberto.set(true);
  }

  fecharUsuarios(): void {
    if (this.adicionandoUsuario()) {
      return;
    }
    this.usuariosAberto.set(false);
    this.usuariosAba.set('usuarios');
  }

  abrirAbaModal(aba: 'usuarios' | 'convites'): void {
    this.usuariosAba.set(aba);
    if (aba === 'convites' && !this.convitesCarregados()) {
      this.carregarConvites();
    }
  }

  private carregarConvites(): void {
    const painel = this.painel();
    if (!painel) {
      return;
    }

    this.carregandoConvites.set(true);
    this.erroConvites.set(undefined);

    this.conviteService.listarConvites(painel.id).subscribe({
      next: (resposta) => {
        this.convites.set(resposta.convites ?? []);
        this.convitesCarregados.set(true);
        this.carregandoConvites.set(false);
      },
      error: () => {
        this.erroConvites.set('Não foi possível carregar os convites enviados.');
        this.carregandoConvites.set(false);
      }
    });
  }

  statusInfo(status: StatusConvite): { label: string; classe: string } {
    return STATUS_INFO[status];
  }

  podeReenviar(status: StatusConvite): boolean {
    return status === StatusConvite.Recusado
      || status === StatusConvite.Expirado
      || status === StatusConvite.Invalidado;
  }

  reenviarConvite(convite: ResponseConviteDto): void {
    const painel = this.painel();
    if (!painel || !convite.emailConvidado) {
      return;
    }

    this.reenviandoConviteId.set(convite.id);

    this.conviteService
      .criarConvite(painel.id, {
        email: convite.emailConvidado,
        permissao: convite.permissao,
        urlFrontend: `${window.location.origin}/convites`
      })
      .pipe(finalize(() => this.reenviandoConviteId.set(undefined)))
      .subscribe({
        next: () => this.carregarConvites(),
        error: () => {
          this.erroConvites.set('Não foi possível reenviar o convite. Tente novamente.');
        }
      });
  }

  ehUsuarioLogado(usuarioId: string): boolean {
    return usuarioId === this.accountService.usuarioAtual?.id;
  }

  papelInfo(permissao: PainelPermissao): { label: string; classe: string } {
    return PAPEL_INFO[permissao];
  }

  adicionarUsuario(): void {
    const painel = this.painel();
    if (!painel) {
      return;
    }

    const email = (this.adicionarUsuarioForm.value.email ?? '').trim().toLowerCase();
    const permissao = this.adicionarUsuarioForm.value.permissao as PainelPermissao;

    this.erroAdicionarUsuario.set(undefined);
    this.avisoAdicionarUsuario.set(undefined);

    if (!EMAIL_REGEX.test(email)) {
      this.erroAdicionarUsuario.set('Informe um e-mail válido.');
      return;
    }

    const emailUsuarioAtual = this.accountService.usuarioAtual?.email?.trim().toLowerCase();
    if (emailUsuarioAtual && email === emailUsuarioAtual) {
      this.erroAdicionarUsuario.set('Você não pode se adicionar.');
      return;
    }

    const jaEhMembro = painel.usuarios?.some((u) => u.email?.trim().toLowerCase() === email);
    if (jaEhMembro) {
      this.erroAdicionarUsuario.set('Este e-mail já é membro do painel.');
      return;
    }

    this.adicionandoUsuario.set(true);

    this.conviteService
      .criarConvite(painel.id, {
        email,
        permissao,
        urlFrontend: `${window.location.origin}/convites`
      })
      .subscribe({
        next: () => {
          this.painelService.obterPainel(painel.id).subscribe({
            next: (painelAtualizado) => {
              this.painel.set(painelAtualizado);
              this.adicionandoUsuario.set(false);

              const agoraEhMembro = painelAtualizado.usuarios?.some(
                (u) => u.email?.trim().toLowerCase() === email
              );
              if (agoraEhMembro) {
                this.adicionarUsuarioForm.patchValue({ email: '', permissao: PainelPermissao.Membro });
              } else {
                this.avisoAdicionarUsuario.set(
                  `Convite enviado para ${email}. A pessoa entra no painel assim que aceitar.`
                );
                this.adicionarUsuarioForm.patchValue({ email: '', permissao: PainelPermissao.Membro });
              }
            },
            error: () => {
              this.adicionandoUsuario.set(false);
              this.avisoAdicionarUsuario.set(
                `Convite enviado para ${email}, mas não foi possível atualizar a lista agora. Feche e reabra o modal para ver o resultado.`
              );
            }
          });
        },
        error: (error) => {
          this.adicionandoUsuario.set(false);
          const erros = (error?.error ?? []) as Erro[];
          this.erroAdicionarUsuario.set(
            erros[0]?.descricao ?? 'Não foi possível adicionar esse usuário. Tente novamente.'
          );
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
    if (this.menuAcoesAberto && !this.menuAcoes?.nativeElement.contains(event.target as Node)) {
      this.menuAcoesAberto = false;
    }
  }
}
