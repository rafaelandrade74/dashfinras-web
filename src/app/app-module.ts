import { LOCALE_ID, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { CoreModule } from './core/core-module';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { authExpiredInterceptor } from './core/interceptors/auth-expired.interceptor';
import { MOEDA_MASK_LOCALE_PADRAO } from './core/directives/moeda-mask.directive';

// Locale único suportado hoje (pt-BR): formata currency/date/number pipes em todo o
// app. Trocar no futuro é mudar só este provider — mesma constante usada por
// MoedaMaskDirective como padrão, para não haver dois lugares definindo "o locale".
registerLocaleData(localePt, MOEDA_MASK_LOCALE_PADRAO);

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([loadingInterceptor, authExpiredInterceptor])),
    { provide: LOCALE_ID, useValue: MOEDA_MASK_LOCALE_PADRAO },
  ],
  bootstrap: [App],
})
export class AppModule {}
