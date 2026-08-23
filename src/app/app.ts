import { Component } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: false,
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  constructor(
    protected readonly authService: AuthService,
    protected readonly loadingService: LoadingService,
  ) {}
}
