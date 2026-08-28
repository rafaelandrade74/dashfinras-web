import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PainelList } from './painel-list/painel-list';
import { PainelCriar } from './painel-criar/painel-criar';
import { PainelDetalhe } from './painel-detalhe/painel-detalhe';
import { PainelMovimentacoes } from './painel-movimentacoes/painel-movimentacoes';

const routes: Routes = [
  { path: '', component: PainelList },
  { path: 'criar', component: PainelCriar },
  { path: ':id', component: PainelDetalhe },
  { path: ':id/movimentacoes', component: PainelMovimentacoes }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PainelRoutingModule {}
