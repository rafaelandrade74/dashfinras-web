import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MovimentacaoAcoes } from './movimentacao-acoes';

/**
 * Módulo standalone-friendly (NgModule clássico) com as ações por linha da tabela de
 * movimentações financeiras (marcar como pago, editar tags, cancelar). Importar
 * `MovimentacaoAcoesModule` no módulo da tela de listagem (task DFW-2) para usar
 * `<app-movimentacao-acoes [movimentacao]="m" (alterada)="onAlterada($event)">`.
 */
@NgModule({
  declarations: [MovimentacaoAcoes],
  imports: [CommonModule],
  exports: [MovimentacaoAcoes]
})
export class MovimentacaoAcoesModule {}
