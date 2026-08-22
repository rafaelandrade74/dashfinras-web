import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompletarCadastro } from './completar-cadastro/completar-cadastro';

const routes: Routes = [
  { path: '', component: CompletarCadastro }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CadastroRoutingModule {}
