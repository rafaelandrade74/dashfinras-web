import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PainelList } from './painel-list/painel-list';

const routes: Routes = [
  { path: '', component: PainelList }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PainelRoutingModule {}
