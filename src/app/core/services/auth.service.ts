import { Injectable, inject } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccountService } from './account.service';

// Storage em memória: o SDK do Supabase persiste a sessão aqui em vez de localStorage, para que o
// access_token/refresh_token não fiquem expostos a XSS. A sessão só dura enquanto o AuthService
// vive na memória do JS (perdida em um reload de página) — a partir do login, quem sustenta a
// sessão entre requisições é o cookie httpOnly setado pela API (ver AccountService.login).
class MemoryStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const supabase = createClient(environment.supabase.url, environment.supabase.anonKey, {
  auth: { storage: new MemoryStorage() }
});

export interface AuthResult {
  error?: string;
  precisaConfirmarEmail?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accountService = inject(AccountService);
  private readonly sessionSubject = new BehaviorSubject<Session | null>(null);
  private readonly readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = supabase.auth.getSession().then(({ data }) => {
      this.sessionSubject.next(data.session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionSubject.next(session);
    });
  }

  waitUntilReady(): Promise<void> {
    return this.readyPromise;
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: this.traduzirErro(error.message) };
      }

      if (data.session) {
        await this.trocarSessaoPorCookies(data.session);
      }

      this.sessionSubject.next(data.session);
      return {};
    } catch {
      return { error: this.erroDeConexao() };
    }
  }

  async signUp(email: string, password: string, redirectUrl?: string): Promise<AuthResult> {
    try {
      const emailRedirectTo = redirectUrl
        ? `${window.location.origin}/login?redirectUrl=${encodeURIComponent(redirectUrl)}`
        : `${window.location.origin}/login`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo }
      });
      if (error) {
        return { error: this.traduzirErro(error.message) };
      }

      if (data.session) {
        await this.trocarSessaoPorCookies(data.session);
        this.sessionSubject.next(data.session);
        return {};
      }

      // Supabase's anti-enumeration behavior: signing up with an already-registered e-mail
      // returns 200 with a user that has no identities, instead of an error.
      const jaCadastrado = data.user && data.user.identities?.length === 0;
      if (jaCadastrado) {
        return {
          error: 'Este e-mail já está cadastrado. Tente entrar em vez de criar uma nova conta.'
        };
      }

      // No session and a real new user: e-mail confirmation is required before login.
      return { precisaConfirmarEmail: true };
    } catch {
      return { error: this.erroDeConexao() };
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
      });

      if (error) {
        return { error: this.traduzirErro(error.message) };
      }

      return {};
    } catch {
      return { error: this.erroDeConexao() };
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.accountService.logout());
    } finally {
      await supabase.auth.signOut();
      this.sessionSubject.next(null);
    }
  }

  get isAuthenticated(): boolean {
    return this.sessionSubject.value !== null;
  }

  get nomeUsuario(): string | undefined {
    const user = this.sessionSubject.value?.user;
    return (user?.user_metadata?.['name'] as string) ?? user?.email;
  }

  private trocarSessaoPorCookies(session: Session): Promise<void> {
    return firstValueFrom(
      this.accountService.login({
        accessToken: session.access_token,
        refreshToken: session.refresh_token
      })
    );
  }

  private traduzirErro(mensagem: string): string {
    if (mensagem === 'Invalid login credentials') {
      return 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
    }

    if (mensagem.toLowerCase().includes('already registered')) {
      return 'Este e-mail já está cadastrado. Tente entrar em vez de criar uma nova conta.';
    }

    return mensagem;
  }

  private erroDeConexao(): string {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }
}
