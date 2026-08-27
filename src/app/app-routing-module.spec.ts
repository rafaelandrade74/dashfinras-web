import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppRoutingModule } from './app-routing-module';
import { authGuard } from './core/guards/auth.guard';
import { accountGuard } from './core/guards/account.guard';

describe('AppRoutingModule', () => {
  it('exige sessão e cadastro completo antes de abrir a tela de convite', () => {
    TestBed.configureTestingModule({ imports: [AppRoutingModule] });
    const router = TestBed.inject(Router);

    const rotaConvite = router.config.find(rota => rota.path === 'convites/:token');

    expect(rotaConvite?.canActivate).toEqual([authGuard, accountGuard]);
  });
});
