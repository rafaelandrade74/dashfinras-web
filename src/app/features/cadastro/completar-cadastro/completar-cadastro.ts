import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { Erro } from '../../../core/models/erro.model';

@Component({
  selector: 'app-completar-cadastro',
  standalone: false,
  styleUrl: './completar-cadastro.scss',
  templateUrl: './completar-cadastro.html',
})
export class CompletarCadastro {
  readonly form: FormGroup;
  readonly salvando = signal(false);
  readonly mensagemErro = signal<string | undefined>(undefined);

  constructor(
    private readonly fb: FormBuilder,
    private readonly accountService: AccountService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set(undefined);

    const { firstName, lastName } = this.form.value;

    this.accountService.adicionarUsuario({ firstName, lastName }).subscribe({
      next: () => {
        this.salvando.set(false);
        const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/paineis';
        this.router.navigateByUrl(redirectUrl);
      },
      error: (error) => {
        this.salvando.set(false);
        const erros = (error?.error ?? []) as Erro[];
        this.mensagemErro.set(
          erros[0]?.descricao ?? 'Não foi possível concluir o cadastro. Tente novamente.'
        );
      }
    });
  }
}
