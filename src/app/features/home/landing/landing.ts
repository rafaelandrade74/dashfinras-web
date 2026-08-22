import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: false,
  styleUrl: './landing.scss',
  templateUrl: './landing.html',
})
export class Landing implements AfterViewInit, OnDestroy {
  @ViewChildren('folioRow') private readonly folioRows!: QueryList<ElementRef<HTMLElement>>;
  private observer?: IntersectionObserver;

  constructor(protected readonly authService: AuthService) {}

  get ctaLink(): string {
    return this.authService.isAuthenticated ? '/paineis' : '/login';
  }

  get ctaLabel(): string {
    return this.authService.isAuthenticated ? 'Ir para meus painéis' : 'Criar meu painel';
  }

  get navCtaLabel(): string {
    return this.authService.isAuthenticated ? 'Meus painéis' : 'Entrar';
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
