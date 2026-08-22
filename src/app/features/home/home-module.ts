import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing-module';
import { Landing } from './landing/landing';

@NgModule({
  declarations: [Landing],
  imports: [CommonModule, HomeRoutingModule],
})
export class HomeModule {}
