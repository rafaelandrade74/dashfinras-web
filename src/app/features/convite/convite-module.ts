import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConviteRoutingModule } from './convite-routing-module';
import { ConviteResponder } from './convite-responder/convite-responder';

@NgModule({
  declarations: [ConviteResponder],
  imports: [CommonModule, ConviteRoutingModule],
})
export class ConviteModule {}
