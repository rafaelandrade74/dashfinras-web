import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type Modo = 'login' | 'signup' | 'forgot' | 'forgot-sent';

@Component({
  selector: 'app-login',
  standalone: false,
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  modo: Modo = 'login';
  carregando = false;
  mensagemErro?: string;
  emailRecuperacao = '';

  readonly loginForm: FormGroup;
  readonly signupForm: FormGroup;
  readonly forgotForm: FormGroup;

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
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', Validators.required]
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  irPara(modo: Modo): void {
    this.modo = modo;
    this.mensagemErro = undefined;
  }

  private get redirectUrl(): string {
    return this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/paineis';
  }

  entrar(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.carregando = true;
    this.mensagemErro = undefined;
    const { email, senha } = this.loginForm.value;

    this.authService
      .login(email, senha)
      .then((resultado) => {
        if (resultado.error) {
          this.mensagemErro = resultado.error;
          return;
        }

        this.router.navigateByUrl(this.redirectUrl);
      })
      .catch(() => {
        this.mensagemErro = 'Não foi possível concluir o login. Tente novamente.';
      })
      .finally(() => {
        this.carregando = false;
      });
  }

  criarConta(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { email, senha, confirmarSenha } = this.signupForm.value;
    if (senha !== confirmarSenha) {
      this.mensagemErro = 'As senhas informadas não coincidem.';
      return;
    }

    this.carregando = true;
    this.mensagemErro = undefined;

    this.authService
      .signUp(email, senha)
      .then((resultado) => {
        if (resultado.error) {
          this.mensagemErro = resultado.error;
          return;
        }

        this.router.navigate(['/completar-cadastro'], {
          queryParams: { redirectUrl: this.redirectUrl }
        });
      })
      .catch(() => {
        this.mensagemErro = 'Não foi possível concluir o cadastro. Tente novamente.';
      })
      .finally(() => {
        this.carregando = false;
      });
  }

  enviarRecuperacao(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.carregando = true;
    this.mensagemErro = undefined;
    const { email } = this.forgotForm.value;

    this.authService
      .resetPassword(email)
      .then((resultado) => {
        if (resultado.error) {
          this.mensagemErro = resultado.error;
          return;
        }

        this.emailRecuperacao = email;
        this.modo = 'forgot-sent';
      })
      .catch(() => {
        this.mensagemErro = 'Não foi possível enviar o link de recuperação. Tente novamente.';
      })
      .finally(() => {
        this.carregando = false;
      });
  }
}
