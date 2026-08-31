import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConviteResponder } from './convite-responder/convite-responder';

const routes: Routes = [
  { path: '', component: ConviteResponder }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConviteRoutingModule {}
