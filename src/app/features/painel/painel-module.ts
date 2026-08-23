import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

import { PainelRoutingModule } from './painel-routing-module';
import { PainelList } from './painel-list/painel-list';

@NgModule({
  declarations: [PainelList],
  imports: [
    CommonModule,
    PainelRoutingModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
  ],
})
export class PainelModule {}
