import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Erro } from '../../../core/models/erro.model';
import { CategoriaResumoDto, RequestRegistrarMovimentacaoDto, TipoMovimentacao } from './movimentacao-financeira-temp.model';
import { MovimentacaoFinanceiraTempService } from './movimentacao-financeira-temp.service';

const COMPETENCIA_REGEX = /^(0[1-9]|1[0-2])\/\d{4}$/;

// VR-001 (data-model.md do backend): Competencia deve ter exatamente 6 dígitos, com os
// 2 últimos representando um mês entre 01 e 12. O campo é digitado como MM/AAAA e
// convertido para o formato yyyyMM esperado pela API antes do envio.
function competenciaValidator(control: AbstractControl): ValidationErrors | null {
  const valor = (control.value ?? '').toString().trim();
  if (!valor) {
    return { required: true };
  }
  return COMPETENCIA_REGEX.test(valor) ? null : { competenciaInvalida: true };
}

// VR-002: Valor deve ser maior que zero.
function valorPositivoValidator(control: AbstractControl): ValidationErrors | null {
  const bruto = control.value;
  if (bruto === null || bruto === undefined || bruto === '') {
    return { required: true };
  }
  const numero = typeof bruto === 'number' ? bruto : Number(String(bruto).replace(',', '.'));
  if (Number.isNaN(numero)) {
    return { valorInvalido: true };
  }
  return numero > 0 ? null : { valorInvalido: true };
}

export function competenciaParaInteiro(valorFormatado: string): number {
  const [mes, ano] = valorFormatado.trim().split('/');
  return Number(ano) * 100 + Number(mes);
}

@Component({
  selector: 'app-registrar-movimentacao-modal',
  standalone: false,
  styleUrl: './registrar-movimentacao-modal.scss',
  templateUrl: './registrar-movimentacao-modal.html',
})
export class RegistrarMovimentacaoModal implements OnChanges {
  @Input() aberto = false;
  @Input() idPainel: string | undefined;
  @Input() nomePainel: string | undefined;
  @Input() categorias: CategoriaResumoDto[] = [];

  @Output() fechar = new EventEmitter<void>();
  @Output() registrado = new EventEmitter<void>();

  readonly TipoMovimentacao = TipoMovimentacao;

  readonly registrando = signal(false);
  readonly erroApi = signal<string | undefined>(undefined);

  readonly form: FormGroup;

  private novaTag = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly movimentacaoService: MovimentacaoFinanceiraTempService
  ) {
    this.form = this.fb.group({
      tipo: [TipoMovimentacao.Despesa, Validators.required],
      valor: ['', valorPositivoValidator],
      competencia: ['', competenciaValidator],
      idCategoria: ['', Validators.required],
      tags: this.fb.control<string[]>([]),
      observacao: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aberto'] && this.aberto) {
      this.resetar();
    }
  }

  private resetar(): void {
    this.form.reset({
      tipo: TipoMovimentacao.Despesa,
      valor: '',
      competencia: '',
      idCategoria: '',
      tags: [],
      observacao: ''
    });
    this.novaTag = '';
    this.erroApi.set(undefined);
    this.registrando.set(false);
  }

  get tags(): string[] {
    return (this.form.controls['tags'].value ?? []) as string[];
  }

  selecionarTipo(tipo: TipoMovimentacao): void {
    this.form.controls['tipo'].setValue(tipo);
  }

  adicionarTag(input: HTMLInputElement): void {
    const valor = input.value.trim();
    if (!valor || this.tags.includes(valor)) {
      input.value = '';
      return;
    }
    this.form.controls['tags'].setValue([...this.tags, valor]);
    input.value = '';
  }

  removerTag(tag: string): void {
    this.form.controls['tags'].setValue(this.tags.filter((t) => t !== tag));
  }

  onTagKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.adicionarTag(input);
    }
  }

  fecharModal(): void {
    if (this.registrando()) {
      return;
    }
    this.fechar.emit();
  }

  registrar(): void {
    if (this.form.invalid || !this.idPainel) {
      this.form.markAllAsTouched();
      return;
    }

    this.registrando.set(true);
    this.erroApi.set(undefined);

    const { tipo, valor, competencia, idCategoria, tags, observacao } = this.form.value;

    const payload: RequestRegistrarMovimentacaoDto = {
      idPainel: this.idPainel,
      tipo,
      idCategoria,
      competencia: competenciaParaInteiro(competencia),
      valor: typeof valor === 'number' ? valor : Number(String(valor).replace(',', '.')),
      observacao: observacao?.trim() || undefined,
      tags: tags?.length ? tags : undefined
    };

    this.movimentacaoService
      .registrar(payload)
      .pipe(finalize(() => this.registrando.set(false)))
      .subscribe({
        next: () => {
          this.registrado.emit();
          this.fechar.emit();
        },
        error: (error) => {
          const erros = (error?.error ?? []) as Erro[];
          this.erroApi.set(erros[0]?.descricao ?? 'Não foi possível registrar a movimentação. Tente novamente.');
        }
      });
  }
}
