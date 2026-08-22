import { Component } from '@angular/core';
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
  salvando = false;
  mensagemErro?: string;

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

    this.salvando = true;
    this.mensagemErro = undefined;

    const { firstName, lastName } = this.form.value;

    this.accountService.adicionarUsuario({ firstName, lastName }).subscribe({
      next: () => {
        this.salvando = false;
        const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/paineis';
        this.router.navigateByUrl(redirectUrl);
      },
      error: (error) => {
        this.salvando = false;
        const erros = (error?.error ?? []) as Erro[];
        this.mensagemErro = erros[0]?.descricao ?? 'Não foi possível concluir o cadastro. Tente novamente.';
      }
    });
  }
}
