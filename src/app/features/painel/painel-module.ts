import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { PainelRoutingModule } from './painel-routing-module';
import { PainelList } from './painel-list/painel-list';

@NgModule({
  declarations: [PainelList],
  imports: [CommonModule, PainelRoutingModule, TableModule, ButtonModule],
})
export class PainelModule {}
