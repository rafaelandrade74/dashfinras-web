import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  signal,
  ViewChildren
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: false,
  styleUrl: './landing.scss',
  templateUrl: './landing.html',
})
export class Landing implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('folioRow') private readonly folioRows!: QueryList<ElementRef<HTMLElement>>;
  private observer?: IntersectionObserver;

  private readonly sessaoConfirmada = signal(false);

  constructor(protected readonly authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    await this.authService.waitUntilReady();
    this.sessaoConfirmada.set(this.authService.isAuthenticated);
  }

  get ctaLink(): string {
    return this.sessaoConfirmada() ? '/paineis' : '/login';
  }

  get ctaLabel(): string {
    return this.sessaoConfirmada() ? 'Ir para meus painéis' : 'Criar meu painel';
  }

  get navCtaLabel(): string {
    return this.sessaoConfirmada() ? 'Meus painéis' : 'Entrar';
  }

  ngAfterViewInit(): void {
    const elements = this.folioRows.map((ref) => ref.nativeElement);
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('in-view'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => this.observer!.observe(el));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
