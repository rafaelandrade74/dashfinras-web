import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Landing } from './landing';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;
  let resolverReady: () => void;
  let authServiceMock: { isAuthenticated: boolean; waitUntilReady: () => Promise<void> };

  beforeEach(async () => {
    const readyPromise = new Promise<void>((resolve) => {
      resolverReady = resolve;
    });
    authServiceMock = {
      isAuthenticated: false,
      waitUntilReady: () => readyPromise
    };

    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      declarations: [Landing],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', async () => {
    resolverReady();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('mostra o estado não-autenticado enquanto a verificação de sessão está pendente', () => {
    expect(component.navCtaLabel).toBe('Entrar');
    expect(component.ctaLabel).toBe('Criar meu painel');
    expect(component.ctaLink).toBe('/login');
  });

  it('mostra o estado autenticado depois que waitUntilReady resolve com sessão válida', async () => {
    authServiceMock.isAuthenticated = true;
    resolverReady();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.navCtaLabel).toBe('Meus painéis');
    expect(component.ctaLabel).toBe('Ir para meus painéis');
    expect(component.ctaLink).toBe('/paineis');
  });

  it('mantém o estado não-autenticado depois que waitUntilReady resolve sem sessão válida', async () => {
    authServiceMock.isAuthenticated = false;
    resolverReady();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.navCtaLabel).toBe('Entrar');
    expect(component.ctaLabel).toBe('Criar meu painel');
    expect(component.ctaLink).toBe('/login');
  });
});
