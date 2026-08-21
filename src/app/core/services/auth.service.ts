import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly keycloak: Keycloak) {}

  login(): Promise<void> {
    return this.keycloak.login();
  }

  logout(): Promise<void> {
    return this.keycloak.logout();
  }

  get isAuthenticated(): boolean {
    return this.keycloak.authenticated ?? false;
  }

  get token(): string | undefined {
    return this.keycloak.token;
  }
}
