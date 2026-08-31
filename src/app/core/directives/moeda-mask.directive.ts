import { Directive, ElementRef, HostListener, Input, Renderer2, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// Locale/moeda padrão da máscara — hoje só o formato brasileiro é necessário, mas fica
// como constante (e como @Input sobrescrevível abaixo) para o dia em que a aplicação
// precisar de outro locale/moeda sem reescrever a diretiva.
export const MOEDA_MASK_LOCALE_PADRAO = 'pt-BR';

/**
 * Máscara de valor monetário: o usuário só digita números (sem vírgula/ponto) e as
 * casas decimais vão se preenchendo da direita para a esquerda, como em caixas de banco
 * (ex.: digitar "150000" vira "1.500,00"). O FormControl guarda o número puro
 * (1500), nunca o texto formatado — quem lê o valor não precisa fazer parsing.
 */
@Directive({
  selector: '[appMoedaMask]',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoedaMaskDirective), multi: true }
  ]
})
export class MoedaMaskDirective implements ControlValueAccessor {
  @Input() moedaLocale = MOEDA_MASK_LOCALE_PADRAO;

  private onChange: (valor: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private readonly el: ElementRef<HTMLInputElement>,
    private readonly renderer: Renderer2
  ) {}

  @HostListener('input')
  aoDigitar(): void {
    const digitos = this.el.nativeElement.value.replace(/\D/g, '');

    if (!digitos) {
      this.escreverNoInput('');
      this.onChange(null);
      return;
    }

    const numero = Number(digitos) / 100;
    this.escreverNoInput(this.formatar(numero));
    this.onChange(numero);
  }

  @HostListener('blur')
  aoSairDoCampo(): void {
    this.onTouched();
  }

  writeValue(valor: number | null): void {
    this.escreverNoInput(valor != null && !Number.isNaN(valor) ? this.formatar(valor) : '');
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  private formatar(numero: number): string {
    return new Intl.NumberFormat(this.moedaLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero);
  }

  private escreverNoInput(texto: string): void {
    this.renderer.setProperty(this.el.nativeElement, 'value', texto);
  }
}
