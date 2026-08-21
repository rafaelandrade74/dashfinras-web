import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  carregando = false;

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute
  ) {}

  entrar(): void {
    this.carregando = true;
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/paineis';
    this.authService.login(redirectUrl);
  }
}
