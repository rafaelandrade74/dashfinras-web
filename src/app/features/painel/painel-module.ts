import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PainelRoutingModule } from './painel-routing-module';
import { PainelList } from './painel-list/painel-list';

@NgModule({
  declarations: [PainelList],
  imports: [CommonModule, PainelRoutingModule, MatTableModule, MatProgressSpinnerModule],
})
export class PainelModule {}
