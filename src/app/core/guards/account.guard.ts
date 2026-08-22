import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AccountService } from '../services/account.service';
import { Erro } from '../models/erro.model';

const USER_NOT_FOUND = 'USER_NOT_FOUND';

export const accountGuard: CanActivateFn = (_route, state) => {
  const accountService = inject(AccountService);
  const router = inject(Router);

  return accountService.obterUsuario().pipe(
    map(() => true),
    catchError((error) => {
      const erros = Array.isArray(error?.error) ? (error.error as Erro[]) : [];
      const naoCadastrado = erros.some(erro => erro.codigo === USER_NOT_FOUND);

      if (naoCadastrado) {
        return of(router.parseUrl(`/completar-cadastro?redirectUrl=${encodeURIComponent(state.url)}`));
      }

      return of(true);
    })
  );
};
