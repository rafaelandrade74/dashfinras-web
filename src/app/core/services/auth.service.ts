import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly keycloak: Keycloak) {}

  login(redirectUrl?: string): Promise<void> {
    return this.keycloak.login({
      redirectUri: redirectUrl ? `${window.location.origin}${redirectUrl}` : undefined
    });
  }

  logout(): Promise<void> {
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }

  get isAuthenticated(): boolean {
    return this.keycloak.authenticated ?? false;
  }

  get token(): string | undefined {
    return this.keycloak.token;
  }

  get nomeUsuario(): string | undefined {
    const profile = this.keycloak.tokenParsed;
    return (profile?.['name'] as string) ?? (profile?.['preferred_username'] as string);
  }
}
