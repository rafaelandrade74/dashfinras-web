import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PainelService } from '../../../core/services/painel.service';
import { ConviteService } from '../../../core/services/convite.service';
import { AccountService } from '../../../core/services/account.service';
import { Erro } from '../../../core/models/erro.model';
import { PainelPermissao } from '../../../core/models/painel.model';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ConvitePendente {
  email: string;
  permissao: PainelPermissao;
}

export const PAPEIS_CONVITE: { valor: PainelPermissao; label: string }[] = [
  { valor: PainelPermissao.Administrador, label: 'Adm' },
  { valor: PainelPermissao.Membro, label: 'Membro' },
  { valor: PainelPermissao.Visualizador, label: 'Visualizador' }
];

@Component({
  selector: 'app-painel-criar',
  standalone: false,
  styleUrl: './painel-criar.scss',
  templateUrl: './painel-criar.html',
})
export class PainelCriar {
  readonly form: FormGroup;
  readonly conviteForm: FormGroup;
  readonly salvando = signal(false);
  readonly mensagemErro = signal<string | undefined>(undefined);
  readonly avisoConvites = signal<string | undefined>(undefined);

  readonly pendentes = signal<ConvitePendente[]>([]);
  readonly erroConvite = signal<string | undefined>(undefined);

  readonly papeis = PAPEIS_CONVITE;

  constructor(
    private readonly fb: FormBuilder,
    private readonly painelService: PainelService,
    private readonly conviteService: ConviteService,
    private readonly accountService: AccountService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      nome: ['', Validators.required]
    });
    this.conviteForm = this.fb.group({
      email: [''],
      permissao: [PainelPermissao.Membro]
    });
  }

  cancelar(): void {
    this.router.navigateByUrl('/paineis');
  }

  adicionarPendente(): void {
    const email = (this.conviteForm.value.email ?? '').trim().toLowerCase();
    const permissao = this.conviteForm.value.permissao as PainelPermissao;

    this.erroConvite.set(undefined);

    if (!EMAIL_REGEX.test(email)) {
      this.erroConvite.set('Informe um e-mail válido.');
      return;
    }

    const emailUsuarioAtual = this.accountService.usuarioAtual?.email?.trim().toLowerCase();
    if (emailUsuarioAtual && email === emailUsuarioAtual) {
      this.erroConvite.set('Você não pode se convidar.');
      return;
    }

    if (this.pendentes().some((p) => p.email === email)) {
      this.erroConvite.set('Este e-mail já foi adicionado.');
      return;
    }

    this.pendentes.update((lista) => [...lista, { email, permissao }]);
    this.conviteForm.patchValue({ email: '', permissao: PainelPermissao.Membro });
  }

  removerPendente(email: string): void {
    this.pendentes.update((lista) => lista.filter((p) => p.email !== email));
  }

  papelLabel(permissao: PainelPermissao): string {
    return this.papeis.find((p) => p.valor === permissao)?.label ?? '';
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set(undefined);
    this.avisoConvites.set(undefined);

    const { nome } = this.form.value;

    this.painelService.adicionarPainel({ nome }).subscribe({
      next: (painel) => this.dispararConvites(painel.id),
      error: (error) => {
        this.salvando.set(false);
        const erros = (error?.error ?? []) as Erro[];
        this.mensagemErro.set(erros[0]?.descricao ?? 'Não foi possível criar o painel. Tente novamente.');
      }
    });
  }

  private dispararConvites(painelId: string): void {
    const pendentes = this.pendentes();
    if (pendentes.length === 0) {
      this.salvando.set(false);
      this.router.navigateByUrl('/paineis');
      return;
    }

    const urlFrontend = `${window.location.origin}/convites`;

    forkJoin(
      pendentes.map((pendente) =>
        this.conviteService
          .criarConvite(painelId, {
            email: pendente.email,
            permissao: pendente.permissao,
            urlFrontend
          })
          .pipe(catchError(() => of({ falhouEmail: pendente.email })))
      )
    ).subscribe((resultados) => {
      this.salvando.set(false);

      const emailsComFalha = resultados
        .filter((resultado): resultado is { falhouEmail: string } => 'falhouEmail' in resultado)
        .map((resultado) => resultado.falhouEmail);

      if (emailsComFalha.length > 0) {
        this.avisoConvites.set(
          `O painel foi criado, mas houve um problema ao enviar o convite para: ${emailsComFalha.join(', ')}. Reenvie pela aba "Convites enviados" na tela do painel.`
        );
        return;
      }

      this.router.navigateByUrl('/paineis');
    });
  }
}
