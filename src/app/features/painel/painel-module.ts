import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PainelRoutingModule } from './painel-routing-module';
import { PainelList } from './painel-list/painel-list';
import { PainelCriar } from './painel-criar/painel-criar';
import { PainelDetalhe } from './painel-detalhe/painel-detalhe';
import { PainelMovimentacoes } from './painel-movimentacoes/painel-movimentacoes';

@NgModule({
  declarations: [PainelList, PainelCriar, PainelDetalhe, PainelMovimentacoes],
  imports: [CommonModule, ReactiveFormsModule, PainelRoutingModule, MatTableModule, MatProgressSpinnerModule],
})
export class PainelModule {}
