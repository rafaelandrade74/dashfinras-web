import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'paineis', pathMatch: 'full' },
  {
    path: 'paineis',
    loadChildren: () => import('./features/painel/painel-module').then(m => m.PainelModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
