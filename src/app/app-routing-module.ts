import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { accountGuard } from './core/guards/account.guard';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./features/home/home-module').then(m => m.HomeModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: 'completar-cadastro',
    canActivate: [authGuard],
    loadChildren: () => import('./features/cadastro/cadastro-module').then(m => m.CadastroModule)
  },
  {
    path: 'convites/:token',
    canActivate: [authGuard, accountGuard],
    loadChildren: () => import('./features/convite/convite-module').then(m => m.ConviteModule)
  },
  {
    path: 'paineis',
    canActivate: [authGuard, accountGuard],
    loadChildren: () => import('./features/painel/painel-module').then(m => m.PainelModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
