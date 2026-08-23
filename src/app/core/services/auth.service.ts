import { Injectable } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.supabase.url, environment.supabase.anonKey);

export interface AuthResult {
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
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

      this.sessionSubject.next(data.session);
      return {};
    } catch {
      return { error: this.erroDeConexao() };
    }
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: this.traduzirErro(error.message) };
      }

      if (!data.session) {
        return { error: 'Não foi possível concluir o cadastro. Tente novamente.' };
      }

      this.sessionSubject.next(data.session);
      return {};
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

  logout(): Promise<void> {
    return supabase.auth.signOut().then(() => {
      this.sessionSubject.next(null);
    });
  }

  get isAuthenticated(): boolean {
    return this.sessionSubject.value !== null;
  }

  get token(): string | undefined {
    return this.sessionSubject.value?.access_token;
  }

  get nomeUsuario(): string | undefined {
    const user = this.sessionSubject.value?.user;
    return (user?.user_metadata?.['name'] as string) ?? user?.email;
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
