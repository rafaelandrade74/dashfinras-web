import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  avaliarCriteriosSenha,
  passwordComplexityValidator,
  PasswordCriterios
} from '../../../core/validators/password-complexity.validator';

type ForcaSenha = 'vazia' | 'fraca' | 'media' | 'forte' | 'excelente';

type Modo = 'login' | 'signup' | 'forgot' | 'forgot-sent';

@Component({
  selector: 'app-login',
  standalone: false,
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  readonly modo = signal<Modo>('login');
  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | undefined>(undefined);
  readonly emailRecuperacao = signal('');

  readonly loginForm: FormGroup;
  readonly signupForm: FormGroup;
  readonly forgotForm: FormGroup;

  readonly senhaCriterios: () => PasswordCriterios;
  readonly senhaForcaPercentual: () => number;
  readonly senhaForca: () => ForcaSenha;

  readonly senhaForcaLabel: Record<ForcaSenha, string> = {
    vazia: '',
    fraca: 'Fraca',
    media: 'Média',
    forte: 'Forte',
    excelente: 'Excelente'
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required]
    });

    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8), passwordComplexityValidator]],
      confirmarSenha: ['', Validators.required]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    const senhaValor = toSignal(this.signupForm.controls['senha'].valueChanges, {
      initialValue: ''
    });

    this.senhaCriterios = computed(() => avaliarCriteriosSenha(senhaValor() ?? ''));

    this.senhaForcaPercentual = computed(() => {
      const criterios = Object.values(this.senhaCriterios());
      const atendidos = criterios.filter(Boolean).length;
      return Math.round((atendidos / criterios.length) * 100);
    });

    this.senhaForca = computed<ForcaSenha>(() => {
      if (!senhaValor()) {
        return 'vazia';
      }

      const percentual = this.senhaForcaPercentual();
      if (percentual <= 20) {
        return 'fraca';
      }
      if (percentual <= 60) {
        return 'media';
      }
      if (percentual < 100) {
        return 'forte';
      }
      return 'excelente';
    });
  }

  irPara(modo: Modo): void {
    this.modo.set(modo);
    this.mensagemErro.set(undefined);
  }

  private get redirectUrl(): string {
    return this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/paineis';
  }

  entrar(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set(undefined);
    const { email, senha } = this.loginForm.value;

    this.authService
      .login(email, senha)
      .then((resultado) => {
        if (resultado.error) {
          this.mensagemErro.set(resultado.error);
          return;
        }

        this.router.navigateByUrl(this.redirectUrl);
      })
      .catch(() => {
        this.mensagemErro.set('Não foi possível concluir o login. Tente novamente.');
      })
      .finally(() => {
        this.carregando.set(false);
      });
  }

  criarConta(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { email, senha, confirmarSenha } = this.signupForm.value;
    if (senha !== confirmarSenha) {
      this.mensagemErro.set('As senhas informadas não coincidem.');
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set(undefined);

    this.authService
      .signUp(email, senha)
      .then((resultado) => {
        if (resultado.error) {
          this.mensagemErro.set(resultado.error);
          return;
        }

        this.router.navigate(['/completar-cadastro'], {
          queryParams: { redirectUrl: this.redirectUrl }
        });
      })
      .catch(() => {
        this.mensagemErro.set('Não foi possível concluir o cadastro. Tente novamente.');
      })
      .finally(() => {
        this.carregando.set(false);
      });
  }

  enviarRecuperacao(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.mensagemErro.set(undefined);
    const { email } = this.forgotForm.value;

    this.authService
      .resetPassword(email)
      .then((resultado) => {
        if (resultado.error) {
          this.mensagemErro.set(resultado.error);
          return;
        }

        this.emailRecuperacao.set(email);
        this.modo.set('forgot-sent');
      })
      .catch(() => {
        this.mensagemErro.set('Não foi possível enviar o link de recuperação. Tente novamente.');
      })
      .finally(() => {
        this.carregando.set(false);
      });
  }
}
