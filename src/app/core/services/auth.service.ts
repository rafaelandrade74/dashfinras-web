import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface AuthResult {
  error?: string;
  precisaConfirmarEmail?: boolean;
}

interface SessaoUsuario {
  email: string;
  nome?: string;
}

interface SessionResponseDto {
  authenticated: boolean;
  email?: string;
  nome?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<SessaoUsuario | undefined>(undefined);
  private readonly readyPromise: Promise<void>;

  constructor(private readonly http: HttpClient) {
    this.readyPromise = firstValueFrom(this.http.get<SessionResponseDto>('/api/auth/session'))
      .then((session) => {
        this.sessionSubject.next(
          session.authenticated ? { email: session.email!, nome: session.nome } : undefined,
        );
      })
      .catch(() => {
        this.sessionSubject.next(undefined);
      });
  }

  waitUntilReady(): Promise<void> {
    return this.readyPromise;
  }

  async login(email: string, password: string, manterLogado = false): Promise<AuthResult> {
    try {
      await firstValueFrom(
        this.http.post('/api/auth/login', { email, password, manterLogado }),
      );
      this.sessionSubject.next({ email });
      return {};
    } catch (erro) {
      return { error: this.traduzirErro(erro) };
    }
  }

  async signUp(email: string, password: string, redirectUrl?: string): Promise<AuthResult> {
    try {
      const resposta = await firstValueFrom(
        this.http.post<{ ok: true; requiresEmailConfirmation: boolean }>('/api/auth/signup', {
          email,
          password,
          redirectUrl,
        }),
      );

      if (resposta.requiresEmailConfirmation) {
        return { precisaConfirmarEmail: true };
      }

      this.sessionSubject.next({ email });
      return {};
    } catch (erro) {
      return { error: this.traduzirErro(erro) };
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      await firstValueFrom(this.http.post('/api/auth/reset-password', { email }));
      return {};
    } catch (erro) {
      return { error: this.traduzirErro(erro) };
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/logout', {}));
    } finally {
      this.limparSessaoLocal();
    }
  }

  /**
   * Zera o estado local de autenticação sem chamar a API. Usado por logout() e pelo
   * authExpiredInterceptor: quando o servidor já respondeu 401 not_authenticated, a sessão já
   * está destruída do lado dele, então um novo POST /api/auth/logout seria redundante.
   */
  limparSessaoLocal(): void {
    this.sessionSubject.next(undefined);
  }

  get isAuthenticated(): boolean {
    return this.sessionSubject.value !== undefined;
  }

  get nomeUsuario(): string | undefined {
    const sessao = this.sessionSubject.value;
    return sessao?.nome ?? sessao?.email;
  }

  private traduzirErro(erro: unknown): string {
    if (!(erro instanceof HttpErrorResponse)) {
      return this.erroDeConexao();
    }

    const codigo = erro.error?.code as string | undefined;
    switch (codigo) {
      case 'invalid_credentials':
        return 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
      case 'already_registered':
        return 'Este e-mail já está cadastrado. Tente entrar em vez de criar uma nova conta.';
      case 'invalid_request':
        return 'Dados inválidos. Verifique os campos e tente novamente.';
      default:
        return this.erroDeConexao();
    }
  }

  private erroDeConexao(): string {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }
}
