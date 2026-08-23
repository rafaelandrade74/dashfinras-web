import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PainelService } from '../../../core/services/painel.service';
import { Erro } from '../../../core/models/erro.model';

@Component({
  selector: 'app-painel-criar',
  standalone: false,
  styleUrl: './painel-criar.scss',
  templateUrl: './painel-criar.html',
})
export class PainelCriar {
  readonly form: FormGroup;
  readonly salvando = signal(false);
  readonly mensagemErro = signal<string | undefined>(undefined);

  constructor(
    private readonly fb: FormBuilder,
    private readonly painelService: PainelService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      nome: ['', Validators.required]
    });
  }

  cancelar(): void {
    this.router.navigateByUrl('/paineis');
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set(undefined);

    const { nome } = this.form.value;

    this.painelService.adicionarPainel({ nome }).pipe(
      finalize(() => this.salvando.set(false))
    ).subscribe({
      next: () => {
        this.router.navigateByUrl('/paineis');
      },
      error: (error) => {
        const erros = (error?.error ?? []) as Erro[];
        this.mensagemErro.set(erros[0]?.descricao ?? 'Não foi possível criar o painel. Tente novamente.');
      }
    });
  }
}
