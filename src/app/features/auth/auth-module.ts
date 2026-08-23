import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing-module';
import { Login } from './login/login';

@NgModule({
  declarations: [Login],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule
  ],
})
export class AuthModule {}
