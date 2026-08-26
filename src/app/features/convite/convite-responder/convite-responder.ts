import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ConviteService } from '../../../core/services/convite.service';
import { AuthService } from '../../../core/services/auth.service';
import { PainelPermissao } from '../../../core/models/painel.model';
import { ResponseConviteDto } from '../../../core/models/convite.model';
import { Erro } from '../../../core/models/erro.model';

const PAPEL_LABEL: Record<PainelPermissao, string> = {
  [PainelPermissao.Dono]: 'Dono',
  [PainelPermissao.Administrador]: 'Adm',
  [PainelPermissao.Membro]: 'Membro',
  [PainelPermissao.Visualizador]: 'Visualizador'
};

type Decisao = 'aceito' | 'recusado';

@Component({
  selector: 'app-convite-responder',
  standalone: false,
  styleUrl: './convite-responder.scss',
  templateUrl: './convite-responder.html',
})
export class ConviteResponder implements OnInit {
  readonly carregando = signal(true);
  readonly erro = signal<string | undefined>(undefined);
  readonly erroTitulo = signal('Convite inválido');
  readonly convite = signal<ResponseConviteDto | undefined>(undefined);

  readonly respondendo = signal(false);
  readonly erroResposta = signal<string | undefined>(undefined);
  readonly decisao = signal<Decisao | undefined>(undefined);

  private token = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly conviteService: ConviteService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.erro.set('Link de convite inválido.');
      this.carregando.set(false);
      return;
    }

    this.token = token;
    this.carregarConvite();
  }

  private carregarConvite(): void {
    this.carregando.set(true);
    this.erro.set(undefined);

    // GET só retorna 200 enquanto o convite está pendente (PendenteCadastro/PendenteAprovacao).
    // Expirado, já respondido ou token inexistente vêm como erro (Erro[] com um código).
    this.conviteService.obterConvitePorToken(this.token).subscribe({
      next: (convite) => {
        this.convite.set(convite);
        this.carregando.set(false);
      },
      error: (error) => {
        const erros = (error?.error ?? []) as Erro[];
        const codigo = erros[0]?.codigo;
        this.erroTitulo.set(this.tituloErroConvite(codigo));
        this.erro.set(this.mensagemErroConvite(codigo));
        this.carregando.set(false);
      }
    });
  }

  private tituloErroConvite(codigo?: string): string {
    switch (codigo) {
      case 'CONVITE_EXPIRED':
        return 'Convite expirado';
      case 'CONVITE_ALREADY_RESOLVED':
        return 'Convite já respondido';
      case 'CONVITE_NOT_FOUND':
      default:
        return 'Convite inválido';
    }
  }

  private mensagemErroConvite(codigo?: string): string {
    switch (codigo) {
      case 'CONVITE_EXPIRED':
        return 'Este convite expirou. Peça ao dono do painel para enviar um novo.';
      case 'CONVITE_ALREADY_RESOLVED':
        return 'Este convite já foi respondido anteriormente.';
      case 'CONVITE_NOT_FOUND':
      default:
        return 'Este convite não foi encontrado ou não é mais válido.';
    }
  }

  papelLabel(permissao: PainelPermissao): string {
    return PAPEL_LABEL[permissao];
  }

  async aceitar(): Promise<void> {
    await this.responder(() => this.conviteService.aprovarConvite(this.token), 'aceito');
  }

  async recusar(): Promise<void> {
    await this.responder(() => this.conviteService.recusarConvite(this.token), 'recusado');
  }

  private async responder(chamada: () => Observable<ResponseConviteDto>, resultado: Decisao): Promise<void> {
    await this.authService.waitUntilReady();

    if (!this.authService.isAuthenticated) {
      this.router.navigateByUrl(`/login?redirectUrl=${encodeURIComponent(this.router.url)}`);
      return;
    }

    this.respondendo.set(true);
    this.erroResposta.set(undefined);

    chamada().subscribe({
      next: (convite) => {
        this.convite.set(convite);
        this.decisao.set(resultado);
        this.respondendo.set(false);
      },
      error: (error) => {
        this.respondendo.set(false);
        const erros = (error?.error ?? []) as Erro[];
        this.erroResposta.set(
          erros[0]?.descricao ?? 'Não foi possível registrar sua resposta. Tente novamente.'
        );
      }
    });
  }

  irParaPainel(): void {
    const idPainel = this.convite()?.idPainel;
    if (idPainel) {
      this.router.navigateByUrl(`/paineis/${idPainel}`);
    } else {
      this.router.navigateByUrl('/paineis');
    }
  }
}
