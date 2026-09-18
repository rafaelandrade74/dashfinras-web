import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';

const routes: Routes = [
  { path: '', component: Login, title: 'Entrar - DashFinRas' },
  { path: 'criar-conta', component: Login, title: 'Criar conta - DashFinRas' },
  { path: 'recuperar-senha', component: Login, title: 'Recuperar senha - DashFinRas' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
