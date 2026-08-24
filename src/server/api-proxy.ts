import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import type { Request, RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getValidSession } from './session';

function requireApiUrl(): string {
  const url = process.env['API_DASHFINRAS_URL'];
  if (!url) {
    throw new Error("Variável de ambiente 'API_DASHFINRAS_URL' não definida.");
  }
  return url;
}

// O access_token da sessão é resolvido de forma assíncrona (getValidSession) antes do proxy
// rodar, mas o callback proxyReq do http-proxy-middleware é síncrono — guarda o token aqui,
// por requisição, pra ele ler na hora de montar o header de saída.
const accessTokenByRequest = new WeakMap<Request, string>();

/**
 * Proxy genérico para todas as chamadas autenticadas à API .NET (account, painel, etc.), montado
 * em /api. O browser fala só com o próprio domínio do front; aqui o servidor lê o cookie
 * df_session (same-origin) e injeta Authorization: Bearer na chamada de saída — sem CORS.
 * Registrado depois das rotas /api/auth/*, que são tratadas localmente e nunca chegam aqui.
 *
 * A instância do proxy é criada uma única vez (não a cada requisição) — criar de novo por
 * requisição registra listeners novos no Server do Node a cada chamada, disparando um
 * MaxListenersExceededWarning depois de poucas requisições.
 */
export function createApiProxy(supabaseAdmin: Pick<SupabaseClient, 'auth'>): RequestHandler {
  const proxyMiddleware = createProxyMiddleware({
    target: requireApiUrl(),
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        const accessToken = accessTokenByRequest.get(req as Request);
        if (accessToken) {
          proxyReq.setHeader('Authorization', `Bearer ${accessToken}`);
        }
        fixRequestBody(proxyReq, req);
      },
    },
  });

  return async (req, res, next) => {
    const session = await getValidSession(req, res, supabaseAdmin);
    if (!session?.accessToken) {
      res.status(401).json({ code: 'not_authenticated' });
      return;
    }

    accessTokenByRequest.set(req, session.accessToken);
    return proxyMiddleware(req, res, next);
  };
}
