import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { createAuthGuard, AuthGuardData } from 'keycloak-angular';

const isAccessAllowed = async (
  _route: any,
  state: any,
  authData: AuthGuardData
) => {
  const { authenticated } = authData;
  if (authenticated) {
    return true;
  }

  const router = inject(Router);
  return router.parseUrl(`/login?redirectUrl=${encodeURIComponent(state.url)}`);
};

export const authGuard = createAuthGuard(isAccessAllowed);
