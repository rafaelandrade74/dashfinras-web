import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';

export type StatusFiltroMovimentacao = 'Pendente' | 'Pago';

export interface FiltroMovimentacoesDto {
  competencia: string;
  categoria: string | undefined;
  status: StatusFiltroMovimentacao | undefined;
  tags: string[];
}

function filtroVazio(): FiltroMovimentacoesDto {
  return { competencia: '', categoria: undefined, status: undefined, tags: [] };
}

@Component({
  selector: 'app-filtro-movimentacoes',
  standalone: false,
  styleUrl: './filtro-movimentacoes.scss',
  templateUrl: './filtro-movimentacoes.html',
})
export class FiltroMovimentacoes implements OnInit {
  @Input() categorias: string[] = [];
  /** Valor inicial do campo competência (ex.: mês atual), já refletido no primeiro filtroAlterado. */
  @Input() competenciaInicial = '';

  @Output() readonly filtroAlterado = new EventEmitter<FiltroMovimentacoesDto>();

  readonly competencia = signal('');
  readonly categoria = signal<string | undefined>(undefined);
  readonly status = signal<StatusFiltroMovimentacao | undefined>(undefined);
  readonly tags = signal<string[]>([]);
  readonly novaTag = signal('');

  ngOnInit(): void {
    if (this.competenciaInicial) {
      this.competencia.set(this.competenciaInicial);
    }
  }

  private filtroAtual(): FiltroMovimentacoesDto {
    return {
      competencia: this.competencia(),
      categoria: this.categoria(),
      status: this.status(),
      tags: this.tags(),
    };
  }

  private emitir(): void {
    this.filtroAlterado.emit(this.filtroAtual());
  }

  onCompetenciaChange(valor: string): void {
    this.competencia.set(valor);
    this.emitir();
  }

  selecionarMesCompetencia(data: Date, picker: MatDatepicker<Date>): void {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    this.onCompetenciaChange(`${mes}/${data.getFullYear()}`);
    picker.close();
  }

  onCategoriaChange(valor: string): void {
    this.categoria.set(valor === '' ? undefined : valor);
    this.emitir();
  }

  onStatusChange(valor: string): void {
    this.status.set(valor === '' ? undefined : (valor as StatusFiltroMovimentacao));
    this.emitir();
  }

  onNovaTagChange(valor: string): void {
    this.novaTag.set(valor);
  }

  adicionarTag(): void {
    const valor = this.novaTag().trim();
    if (valor === '') {
      return;
    }
    if (this.tags().includes(valor)) {
      this.novaTag.set('');
      return;
    }
    this.tags.set([...this.tags(), valor]);
    this.novaTag.set('');
    this.emitir();
  }

  removerTag(tag: string): void {
    this.tags.set(this.tags().filter((t) => t !== tag));
    this.emitir();
  }

  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.adicionarTag();
      return;
    }
    if (event.key === 'Backspace' && this.novaTag() === '' && this.tags().length > 0) {
      const ultima = this.tags()[this.tags().length - 1];
      this.removerTag(ultima);
    }
  }

  limparFiltros(): void {
    const vazio = filtroVazio();
    this.competencia.set(vazio.competencia);
    this.categoria.set(vazio.categoria);
    this.status.set(vazio.status);
    this.tags.set(vazio.tags);
    this.novaTag.set('');
    this.emitir();
  }
}
