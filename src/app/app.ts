import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  protected readonly ocultarToolbar = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/paineis')),
      startWith(this.router.url.startsWith('/paineis'))
    ),
    { initialValue: this.router.url.startsWith('/paineis') }
  );

  constructor(protected readonly authService: AuthService) {}

  sair(): void {
    this.authService.logout();
  }
}
