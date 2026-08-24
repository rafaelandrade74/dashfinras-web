import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import type { RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getValidSession } from './session';

function requireApiUrl(): string {
  const url = process.env['API_DASHFINRAS_URL'];
  if (!url) {
    throw new Error("Variável de ambiente 'API_DASHFINRAS_URL' não definida.");
  }
  return url;
}

/**
 * Proxy genérico para todas as chamadas autenticadas à API .NET (account, painel, etc.), montado
 * em /api. O browser fala só com o próprio domínio do front; aqui o servidor lê o cookie
 * df_session (same-origin) e injeta Authorization: Bearer na chamada de saída — sem CORS.
 * Registrado depois das rotas /api/auth/*, que são tratadas localmente e nunca chegam aqui.
 */
export function createApiProxy(supabaseAdmin: Pick<SupabaseClient, 'auth'>): RequestHandler {
  return async (req, res, next) => {
    const session = await getValidSession(req, res, supabaseAdmin);
    if (!session?.accessToken) {
      res.status(401).json({ code: 'not_authenticated' });
      return;
    }

    return createProxyMiddleware({
      target: requireApiUrl(),
      changeOrigin: true,
      on: {
        proxyReq: (proxyReq) => {
          proxyReq.setHeader('Authorization', `Bearer ${session.accessToken}`);
          fixRequestBody(proxyReq, req);
        },
      },
    })(req, res, next);
  };
}
