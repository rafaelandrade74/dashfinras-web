import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CadastroRoutingModule } from './cadastro-routing-module';
import { CompletarCadastro } from './completar-cadastro/completar-cadastro';

@NgModule({
  declarations: [CompletarCadastro],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CadastroRoutingModule],
})
export class CadastroModule {}
