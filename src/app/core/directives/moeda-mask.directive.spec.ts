import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MoedaMaskDirective } from './moeda-mask.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MoedaMaskDirective],
  template: `<input appMoedaMask [formControl]="valor" />`
})
class HospedeiraComponent {
  readonly valor = new FormControl<number | null>(null);
}

describe('MoedaMaskDirective', () => {
  let fixture: ComponentFixture<HospedeiraComponent>;
  let component: HospedeiraComponent;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospedeiraComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HospedeiraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  function digitar(texto: string): void {
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('preenche as casas decimais da direita para a esquerda conforme o usuário digita', () => {
    digitar('150000');
    expect(input.value).toBe('1.500,00');
    expect(component.valor.value).toBe(1500);
  });

  it('atualiza incrementalmente a cada dígito', () => {
    digitar('1');
    expect(input.value).toBe('0,01');
    digitar('15');
    expect(input.value).toBe('0,15');
    digitar('150');
    expect(input.value).toBe('1,50');
  });

  it('ignora caracteres não numéricos digitados (vírgula, ponto, letras)', () => {
    digitar('1a5,0.0');
    expect(input.value).toBe('15,00');
    expect(component.valor.value).toBe(15);
  });

  it('limpa o campo e o control quando todos os dígitos são apagados', () => {
    digitar('100');
    digitar('');
    expect(input.value).toBe('');
    expect(component.valor.value).toBeNull();
  });

  it('escreve o valor formatado quando o FormControl é setado programaticamente', () => {
    component.valor.setValue(1234.5);
    fixture.detectChanges();
    expect(input.value).toBe('1.234,50');
  });

  it('limpa o input quando o FormControl é setado para null', () => {
    component.valor.setValue(42);
    fixture.detectChanges();
    component.valor.setValue(null);
    fixture.detectChanges();
    expect(input.value).toBe('');
  });
});
