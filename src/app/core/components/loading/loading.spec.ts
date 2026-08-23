import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Loading } from './loading';

describe('Loading', () => {
  let component: Loading;
  let fixture: ComponentFixture<Loading>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [Loading],
    }).compileComponents();

    fixture = TestBed.createComponent(Loading);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('exibe a primeira dica ao iniciar', () => {
    fixture.detectChanges();
    expect(component.dicaAtual).toBe('Guarde pelo menos 10% da sua renda todo mês antes de gastar qualquer coisa.');
    expect(component.dicaVisivel).toBe(true);
  });

  it('troca de dica após o intervalo configurado', () => {
    vi.useFakeTimers();
    fixture.detectChanges();

    const primeiraDica = component.dicaAtual;

    vi.advanceTimersByTime(4000);
    expect(component.dicaVisivel).toBe(false);

    vi.advanceTimersByTime(520);
    expect(component.dicaVisivel).toBe(true);
    expect(component.dicaAtual).not.toBe(primeiraDica);

    vi.useRealTimers();
  });

  it('para de trocar dicas após destruir o componente', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    fixture.destroy();

    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();

    vi.useRealTimers();
  });
});
