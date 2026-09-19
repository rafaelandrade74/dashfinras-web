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
    expect(component.dicaAtual()).toBe(
      'Guarde pelo menos 10% da sua renda todo mês antes de gastar qualquer coisa.',
    );
    expect(component.dicaVisivel()).toBe(true);
  });

  it('troca de dica após o intervalo configurado', () => {
    vi.useFakeTimers();
    fixture.detectChanges();

    const primeiraDica = component.dicaAtual();

    vi.advanceTimersByTime(4000);
    expect(component.dicaVisivel()).toBe(false);

    vi.advanceTimersByTime(520);
    expect(component.dicaVisivel()).toBe(true);
    expect(component.dicaAtual()).not.toBe(primeiraDica);

    vi.useRealTimers();
  });

  it('para de trocar dicas após destruir o componente', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    fixture.destroy();

    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();

    vi.useRealTimers();
  });

  it('renderiza no DOM a nova dica após a troca', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const primeira = el.querySelector('.tip')!.textContent;

    vi.advanceTimersByTime(4520);
    fixture.detectChanges();

    expect(el.querySelector('.tip')!.textContent).not.toBe(primeira);
    expect(el.querySelector('.tip')!.classList).toContain('visible');

    vi.useRealTimers();
  });

  it('percorre todas as dicas durante 10 minutos sem travar', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    const vistas = new Set<string>([component.dicaAtual()]);

    for (let i = 0; i < 600_000 / 4520; i++) {
      vi.advanceTimersByTime(4520);
      vistas.add(component.dicaAtual());
    }

    expect(vistas.size).toBe(8);

    vi.useRealTimers();
  });

  it('destruir durante o fade não altera o estado nem lança erro', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    const dicaAntes = component.dicaAtual();

    vi.advanceTimersByTime(4000);
    expect(component.dicaVisivel()).toBe(false);
    fixture.destroy();

    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();
    expect(component.dicaAtual()).toBe(dicaAntes);
    expect(component.dicaVisivel()).toBe(false);

    vi.useRealTimers();
  });

  describe('layout da dica', () => {
    it('.tip-wrap ocupa toda a largura do card (evita colapso para 0)', () => {
      fixture.detectChanges();
      const wrap = fixture.nativeElement.querySelector('.tip-wrap') as HTMLElement;
      const estilo = getComputedStyle(wrap);

      expect(estilo.width).toBe('100%');
      expect(estilo.minHeight).toBe('68px');
    });

    it('.tip é ancorado no topo, limitado ao contêiner e quebra palavras longas', () => {
      fixture.detectChanges();
      const tip = fixture.nativeElement.querySelector('.tip') as HTMLElement;
      const estilo = getComputedStyle(tip);

      expect(estilo.position).toBe('absolute');
      expect(estilo.top).toBe('0px');
      expect(estilo.width).toBe('100%');
      expect(estilo.maxWidth).toBe('320px');
      expect(estilo.overflowWrap).toBe('anywhere');
    });
  });
});
