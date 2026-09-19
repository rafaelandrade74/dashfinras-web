import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Rotas de auth cujo próprio chamador (AuthService/Login) já trata o erro de resposta —
// nunca disparar o redirect global nelas, para não interferir no fluxo de login/cadastro/logout
// nem entrar em loop com a checagem de sessão feita no boot da aplicação (GET /api/auth/session,
// que nunca responde 401 — ver server/auth.ts).
const ROTAS_IGNORADAS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/reset-password',
  '/api/auth/logout',
  '/api/auth/session',
];

/**
 * Reconhece uma sessão expirada com a aba já aberta (FR-011): qualquer chamada a /api/* fora da
 * allowlist acima que responda 401 { code: 'not_authenticated' } limpa o estado local de
 * autenticação e redireciona para o login, preservando a página que o usuário tentava acessar —
 * em vez de deixar o erro genérico aparecer na tela (SC-007).
 */
export const authExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  // AuthService NÃO pode ser injetado aqui de forma eager: o construtor dele já dispara
  // GET /api/auth/session, que passa por este interceptor — isso vira dependência circular, a
  // exceção escapa antes do finalize do loadingInterceptor e o spinner global nunca some. Por isso
  // a resolução é adiada (Injector) até o momento em que um 401 realmente acontece.
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((erro: unknown) => {
      const eExpiracaoDeSessao =
        erro instanceof HttpErrorResponse &&
        erro.status === 401 &&
        erro.error?.code === 'not_authenticated' &&
        !ROTAS_IGNORADAS.some((rota) => req.url.endsWith(rota));

      if (eExpiracaoDeSessao) {
        const router = injector.get(Router);
        injector.get(AuthService).limparSessaoLocal();
        router.navigateByUrl(`/login?redirectUrl=${encodeURIComponent(router.url)}`);
      }

      return throwError(() => erro);
    }),
  );
};
