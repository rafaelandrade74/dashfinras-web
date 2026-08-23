import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PainelList } from './painel-list/painel-list';
import { PainelCriar } from './painel-criar/painel-criar';

const routes: Routes = [
  { path: '', component: PainelList },
  { path: 'criar', component: PainelCriar }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PainelRoutingModule {}
