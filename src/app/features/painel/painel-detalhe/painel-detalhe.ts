import { Component, ElementRef, HostListener, OnInit, computed, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, concat, finalize, of, tap } from 'rxjs';
import { PainelService } from '../../../core/services/painel.service';
import { ConviteService } from '../../../core/services/convite.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { MovimentacaoFinanceiraService } from '../../../core/services/movimentacao-financeira.service';
import { PainelPermissao, PainelUsuarioDto, ResponsePainelDto } from '../../../core/models/painel.model';
import { ResponseConviteDto, StatusConvite } from '../../../core/models/convite.model';
import {
  GetMovimentacaoFiltroDto,
  ResponseMovimentacaoDto,
  StatusMovimentacao,
  TipoMovimentacao
} from '../../../core/models/movimentacao-financeira.model';
import { Erro } from '../../../core/models/erro.model';
import { PAPEIS_CONVITE } from '../painel-criar/painel-criar';
import { CategoriaResumoDto } from '../registrar-movimentacao-modal/registrar-movimentacao-modal';
import { FiltroMovimentacoesDto } from '../filtro-movimentacoes/filtro-movimentacoes';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface NavItem {
  icone: string;
  label: string;
  rota?: string;
  badge?: number;
  ativo?: boolean;
}

// Categorias controladas pelo sistema (seed fixo em 20260825011004_SeedCategorias no
// backend). Não há endpoint de categorias ainda — lista replicada aqui até essa feature
// existir (ver specs/003-financial-data-model/data-model.md).
const CATEGORIAS: CategoriaResumoDto[] = [
  { id: 'c0000000-0000-0000-0000-000000000001', nome: 'Moradia' },
  { id: 'c0000000-0000-0000-0000-000000000002', nome: 'Alimentação' },
  { id: 'c0000000-0000-0000-0000-000000000003', nome: 'Transporte' },
  { id: 'c0000000-0000-0000-0000-000000000004', nome: 'Saúde' },
  { id: 'c0000000-0000-0000-0000-000000000005', nome: 'Educação' },
  { id: 'c0000000-0000-0000-0000-000000000006', nome: 'Lazer' },
  { id: 'c0000000-0000-0000-0000-000000000007', nome: 'Salário' },
  { id: 'c0000000-0000-0000-0000-000000000008', nome: 'Investimentos' },
  { id: 'c0000000-0000-0000-0000-000000000009', nome: 'Assinaturas' },
  { id: 'c0000000-0000-0000-0000-000000000010', nome: 'Impostos' }
];

const NOME_CATEGORIA: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((categoria) => [categoria.id, categoria.nome])
);

const ID_CATEGORIA_POR_NOME: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((categoria) => [categoria.nome, categoria.id])
);

const STATUS_FILTRO_PARA_API: Record<'Pendente' | 'Pago', StatusMovimentacao> = {
  Pendente: StatusMovimentacao.Pendente,
  Pago: StatusMovimentacao.Pago
};

const COMPETENCIA_FILTRO_REGEX = /^(0[1-9]|1[0-2])\/\d{4}$/;

function competenciaFiltroParaInteiro(valor: string): number | undefined {
  if (!COMPETENCIA_FILTRO_REGEX.test(valor.trim())) {
    return undefined;
  }
  const [mes, ano] = valor.trim().split('/');
  return Number(ano) * 100 + Number(mes);
}

function formatarCompetencia(competencia: number): string {
  const texto = String(competencia);
  if (texto.length !== 6) {
    return texto;
  }
  return `${texto.slice(4, 6)}/${texto.slice(0, 4)}`;
}

const PAGE_SIZE_LANCAMENTOS = 10;

const PAPEL_INFO: Record<PainelPermissao, { label: string; classe: string }> = {
  [PainelPermissao.Dono]: { label: 'Dono', classe: 'badge-dono' },
  [PainelPermissao.Administrador]: { label: 'Adm', classe: 'badge-adm' },
  [PainelPermissao.Membro]: { label: 'Membro', classe: 'badge-membro' },
  [PainelPermissao.Visualizador]: { label: 'Visualizador', classe: 'badge-visualizador' },
};

const STATUS_INFO: Record<StatusConvite, { label: string; classe: string }> = {
  [StatusConvite.Pendente]: { label: 'Pendente', classe: 'status-pendente' },
  [StatusConvite.Aprovado]: { label: 'Aprovado', classe: 'status-aceito' },
  [StatusConvite.Recusado]: { label: 'Recusado', classe: 'status-recusado' },
  [StatusConvite.Expirado]: { label: 'Expirado', classe: 'status-expirado' },
};

const STATUS_DESCONHECIDO = { label: 'Status desconhecido', classe: 'status-desconhecido' };

const STATUS_MOVIMENTACAO_INFO: Record<StatusMovimentacao, { label: string; classe: string }> = {
  [StatusMovimentacao.Pago]: { label: 'Pago', classe: 'status-pago' },
  [StatusMovimentacao.Pendente]: { label: 'Pendente', classe: 'status-pendente' }
};

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

  readonly lancamentos = signal<ResponseMovimentacaoDto[]>([]);
  readonly carregandoLancamentos = signal(false);
  readonly erroLancamentos = signal<string | undefined>(undefined);

  readonly filtro = signal<FiltroMovimentacoesDto>({
    competencia: '',
    categoria: undefined,
    status: undefined,
    tags: []
  });

  // Tags ainda não são entidades reais no backend (ver movimentacao-acoes.ts): tanto o
  // registro quanto a associação de tags guardam texto livre em idsTags. O filtro por
  // tag, por isso, é aplicado no cliente sobre o que já veio filtrado pelo servidor.
  readonly lancamentosFiltrados = computed(() => {
    const tags = this.filtro().tags;
    const lista = this.lancamentos();
    if (tags.length === 0) {
      return lista;
    }
    return lista.filter((l) => tags.every((tag) => (l.idsTags ?? []).includes(tag)));
  });

  readonly paginaAtual = signal(1);
  readonly pageSizeLancamentos = PAGE_SIZE_LANCAMENTOS;

  readonly totalPaginasLancamentos = computed(() =>
    Math.max(1, Math.ceil(this.lancamentosFiltrados().length / this.pageSizeLancamentos))
  );

  readonly lancamentosPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.pageSizeLancamentos;
    return this.lancamentosFiltrados().slice(inicio, inicio + this.pageSizeLancamentos);
  });

  readonly modalRegistrarAberto = signal(false);
  readonly categorias = CATEGORIAS;
  readonly nomesCategorias = CATEGORIAS.map((c) => c.nome);

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

  readonly usuarioParaRemover = signal<PainelUsuarioDto | undefined>(undefined);
  readonly removendoUsuarioId = signal<string | undefined>(undefined);
  readonly erroRemoverUsuario = signal<string | undefined>(undefined);

  readonly papeisPendentes = signal<Record<string, PainelPermissao>>({});
  readonly salvandoAlteracoes = signal(false);
  readonly errosAlterarPapel = signal<Record<string, string>>({});

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
    private readonly movimentacaoFinanceiraService: MovimentacaoFinanceiraService,
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

    this.carregarLancamentos(id);
  }

  private carregarLancamentos(idPainel: string): void {
    this.carregandoLancamentos.set(true);
    this.erroLancamentos.set(undefined);

    const filtro = this.filtro();
    const filtroApi: GetMovimentacaoFiltroDto = {
      idPainel,
      competencia: competenciaFiltroParaInteiro(filtro.competencia),
      idCategoria: filtro.categoria ? ID_CATEGORIA_POR_NOME[filtro.categoria] : undefined,
      status: filtro.status ? STATUS_FILTRO_PARA_API[filtro.status] : undefined
    };

    this.movimentacaoFinanceiraService
      .consultar(filtroApi)
      .pipe(finalize(() => this.carregandoLancamentos.set(false)))
      .subscribe({
        next: (dados) => this.lancamentos.set(dados),
        error: () => this.erroLancamentos.set('Não foi possível carregar os lançamentos.')
      });
  }

  aoFiltroAlterado(filtro: FiltroMovimentacoesDto): void {
    this.filtro.set(filtro);
    this.paginaAtual.set(1);
    const painel = this.painel();
    if (painel) {
      this.carregarLancamentos(painel.id);
    }
  }

  aoMovimentacaoAlterada(atualizada: ResponseMovimentacaoDto): void {
    this.lancamentos.update((lista) => lista.map((l) => (l.id === atualizada.id ? atualizada : l)));
  }

  paginaAnteriorLancamentos(): void {
    if (this.paginaAtual() > 1) {
      this.paginaAtual.update((pagina) => pagina - 1);
    }
  }

  proximaPaginaLancamentos(): void {
    if (this.paginaAtual() < this.totalPaginasLancamentos()) {
      this.paginaAtual.update((pagina) => pagina + 1);
    }
  }

  descricaoLancamento(l: ResponseMovimentacaoDto): string {
    return l.observacao?.trim() || (l.tipo === TipoMovimentacao.Receita ? 'Receita' : 'Despesa');
  }

  categoriaLancamento(l: ResponseMovimentacaoDto): string {
    return NOME_CATEGORIA[l.idCategoria] ?? l.idCategoria;
  }

  competenciaLancamento(l: ResponseMovimentacaoDto): string {
    return formatarCompetencia(l.competencia);
  }

  valorComSinal(l: ResponseMovimentacaoDto): number {
    return l.tipo === TipoMovimentacao.Despesa ? -Math.abs(l.valor) : Math.abs(l.valor);
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

  get entradasFiltradas(): ResponseMovimentacaoDto[] {
    return this.lancamentosFiltrados().filter((l) => l.tipo === TipoMovimentacao.Receita);
  }

  get saidasFiltradas(): ResponseMovimentacaoDto[] {
    return this.lancamentosFiltrados().filter((l) => l.tipo === TipoMovimentacao.Despesa);
  }

  get totalEntradas(): number {
    return this.entradasFiltradas.reduce((soma, l) => soma + l.valor, 0);
  }

  get totalSaidas(): number {
    return this.saidasFiltradas.reduce((soma, l) => soma - l.valor, 0);
  }

  get saldo(): number {
    return this.totalEntradas + this.totalSaidas;
  }

  statusLancamentoInfo(status: StatusMovimentacao): { label: string; classe: string } {
    return STATUS_MOVIMENTACAO_INFO[status] ?? STATUS_DESCONHECIDO;
  }

  iniciaisUsuario(firstName?: string, lastName?: string): string {
    const primeira = firstName?.charAt(0) ?? '';
    const segunda = lastName?.charAt(0) ?? '';
    return (primeira + segunda).toUpperCase() || '?';
  }

  voltar(): void {
    this.router.navigateByUrl('/paineis');
  }

  abrirRegistrarMovimentacao(): void {
    if (!this.painel()) {
      return;
    }
    this.modalRegistrarAberto.set(true);
  }

  fecharRegistrarMovimentacao(): void {
    this.modalRegistrarAberto.set(false);
  }

  aoRegistrarMovimentacao(): void {
    const painel = this.painel();
    if (painel) {
      this.carregarLancamentos(painel.id);
    }
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
    this.usuarioParaRemover.set(undefined);
    this.erroRemoverUsuario.set(undefined);
    this.papeisPendentes.set({});
    this.errosAlterarPapel.set({});
    this.usuariosAberto.set(true);
  }

  podeFecharUsuarios(): boolean {
    return !this.adicionandoUsuario() && !this.removendoUsuarioId() && !this.salvandoAlteracoes();
  }

  fecharUsuarios(): void {
    if (!this.podeFecharUsuarios()) {
      return;
    }
    this.papeisPendentes.set({});
    this.errosAlterarPapel.set({});
    this.usuariosAberto.set(false);
    this.usuariosAba.set('usuarios');
  }

  concluirUsuarios(): void {
    if (!this.podeFecharUsuarios()) {
      return;
    }

    const pendentes = this.papeisPendentes();
    const idsPendentes = Object.keys(pendentes);

    if (idsPendentes.length === 0) {
      this.usuariosAberto.set(false);
      this.usuariosAba.set('usuarios');
      return;
    }

    const painel = this.painel();
    if (!painel) {
      return;
    }

    this.salvandoAlteracoes.set(true);
    const novosErros: Record<string, string> = {};

    const chamadas = idsPendentes.map((idUsuario) =>
      this.painelService.editarPermissaoUsuarioPainel(painel.id, idUsuario, pendentes[idUsuario]).pipe(
        tap((painelAtualizado) => this.painel.set(painelAtualizado)),
        catchError((error) => {
          const erros = (error?.error ?? []) as Erro[];
          novosErros[idUsuario] = erros[0]?.descricao ?? 'Não foi possível alterar o papel desse usuário. Tente novamente.';
          return of(undefined);
        })
      )
    );

    concat(...chamadas).pipe(
      finalize(() => {
        this.salvandoAlteracoes.set(false);
        this.errosAlterarPapel.set(novosErros);

        const pendentesRestantes: Record<string, PainelPermissao> = {};
        for (const idUsuario of Object.keys(novosErros)) {
          pendentesRestantes[idUsuario] = pendentes[idUsuario];
        }
        this.papeisPendentes.set(pendentesRestantes);

        if (Object.keys(novosErros).length === 0) {
          this.usuariosAberto.set(false);
          this.usuariosAba.set('usuarios');
        }
      })
    ).subscribe();
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
    return STATUS_INFO[status] ?? STATUS_DESCONHECIDO;
  }

  podeReenviar(status: StatusConvite): boolean {
    return status === StatusConvite.Recusado || status === StatusConvite.Expirado;
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

  ehDono(permissao?: PainelPermissao): boolean {
    return permissao === PainelPermissao.Dono;
  }

  abrirRemoverUsuario(usuario: PainelUsuarioDto): void {
    this.erroRemoverUsuario.set(undefined);
    this.usuarioParaRemover.set(usuario);
  }

  fecharRemoverUsuario(): void {
    if (this.removendoUsuarioId()) {
      return;
    }
    this.usuarioParaRemover.set(undefined);
  }

  confirmarRemoverUsuario(): void {
    const painel = this.painel();
    const usuarioAlvo = this.usuarioParaRemover();
    if (!painel || !usuarioAlvo) {
      return;
    }

    this.removendoUsuarioId.set(usuarioAlvo.id);
    this.erroRemoverUsuario.set(undefined);

    this.painelService.removerUsuarioPainel(painel.id, usuarioAlvo.id).pipe(
      finalize(() => this.removendoUsuarioId.set(undefined))
    ).subscribe({
      next: (painelAtualizado) => {
        this.usuarioParaRemover.set(undefined);

        if (this.ehUsuarioLogado(usuarioAlvo.id)) {
          this.usuariosAberto.set(false);
          this.router.navigateByUrl('/paineis');
          return;
        }

        this.painel.set(painelAtualizado);
        this.papeisPendentes.update((pendentes) => {
          const { [usuarioAlvo.id]: _removido, ...resto } = pendentes;
          return resto;
        });
        this.errosAlterarPapel.update((erros) => {
          const { [usuarioAlvo.id]: _removido, ...resto } = erros;
          return resto;
        });
      },
      error: (error) => {
        const erros = (error?.error ?? []) as Erro[];
        this.erroRemoverUsuario.set(
          erros[0]?.descricao ?? 'Não foi possível remover esse usuário. Tente novamente.'
        );
      }
    });
  }

  papelExibido(usuario: PainelUsuarioDto): PainelPermissao | undefined {
    return this.papeisPendentes()[usuario.id] ?? usuario.idPermissao;
  }

  definirPapelPendente(usuario: PainelUsuarioDto, novaPermissao: PainelPermissao): void {
    this.errosAlterarPapel.update((erros) => {
      const { [usuario.id]: _removido, ...resto } = erros;
      return resto;
    });

    if (novaPermissao === usuario.idPermissao) {
      this.papeisPendentes.update((pendentes) => {
        const { [usuario.id]: _removido, ...resto } = pendentes;
        return resto;
      });
      return;
    }

    this.papeisPendentes.update((pendentes) => ({ ...pendentes, [usuario.id]: novaPermissao }));
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
