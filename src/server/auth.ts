import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSession, getValidSession, decodeJwtExp } from './session';

export interface AuthRouterDeps {
  supabaseAdmin: Pick<SupabaseClient, 'auth'>;
  fetchFn?: typeof fetch;
}

function requireApiUrl(): string {
  const url = process.env['API_DASHFINRAS_URL'];
  if (!url) {
    throw new Error("Variável de ambiente 'API_DASHFINRAS_URL' não definida.");
  }
  return url;
}

function errorCode(message: string | undefined): string {
  if (message === 'Invalid login credentials') return 'invalid_credentials';
  if (message?.toLowerCase().includes('already registered')) return 'already_registered';
  return 'unknown';
}

/**
 * Cria o router de auth do BFF, com as dependências (client Supabase, fetch) injetadas em vez de
 * importadas como singleton — permite testar a lógica com dublês, sem mocking de módulo.
 */
export function createAuthRouter({ supabaseAdmin, fetchFn = fetch }: AuthRouterDeps): Router {
  const router = Router();

  /**
   * Troca o access_token/refresh_token do Supabase por cookies httpOnly no api-dashfinras (.NET)
   * — chamada servidor-a-servidor, sem CORS/SameSite envolvidos. O Set-Cookie devolvido pela API
   * é ignorado: quem sustenta a sessão do browser é o cookie df_session, same-origin com o front.
   */
  async function trocarSessaoPelaApi(accessToken: string, refreshToken: string): Promise<boolean> {
    try {
      const response = await fetchFn(`${requireApiUrl()}/account/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ code: 'invalid_request' });
    }

    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        return res.status(401).json({ code: errorCode(error?.message) });
      }

      const trocouComSucesso = await trocarSessaoPelaApi(
        data.session.access_token,
        data.session.refresh_token,
      );
      if (!trocouComSucesso) {
        return res.status(502).json({ code: 'account_api_unavailable' });
      }

      const session = await getSession(req, res);
      session.accessToken = data.session.access_token;
      session.refreshToken = data.session.refresh_token;
      session.expiresAt = decodeJwtExp(data.session.access_token);
      await session.save();

      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ code: 'network_error' });
    }
  });

  router.post('/signup', async (req, res) => {
    const { email, password, redirectUrl } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ code: 'invalid_request' });
    }

    try {
      const origin = `${req.protocol}://${req.get('host')}`;
      const emailRedirectTo = redirectUrl
        ? `${origin}/login?redirectUrl=${encodeURIComponent(redirectUrl)}`
        : `${origin}/login`;

      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      if (error) {
        return res.status(400).json({ code: errorCode(error.message) });
      }

      if (data.session) {
        const trocouComSucesso = await trocarSessaoPelaApi(
          data.session.access_token,
          data.session.refresh_token,
        );
        if (!trocouComSucesso) {
          return res.status(502).json({ code: 'account_api_unavailable' });
        }

        const session = await getSession(req, res);
        session.accessToken = data.session.access_token;
        session.refreshToken = data.session.refresh_token;
        session.expiresAt = decodeJwtExp(data.session.access_token);
        await session.save();

        return res.status(200).json({ ok: true, requiresEmailConfirmation: false });
      }

      // Comportamento anti-enumeração do Supabase: cadastro com e-mail já registrado retorna 200
      // com um usuário sem identidades, em vez de erro.
      const jaCadastrado = data.user && data.user.identities?.length === 0;
      if (jaCadastrado) {
        return res.status(409).json({ code: 'already_registered' });
      }

      return res.status(200).json({ ok: true, requiresEmailConfirmation: true });
    } catch {
      return res.status(500).json({ code: 'network_error' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    const { email } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ code: 'invalid_request' });
    }

    try {
      const origin = `${req.protocol}://${req.get('host')}`;
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/login`,
      });
      if (error) {
        return res.status(400).json({ code: errorCode(error.message) });
      }

      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ code: 'network_error' });
    }
  });

  router.post('/logout', async (req, res) => {
    const session = await getSession(req, res);

    if (session.accessToken) {
      try {
        await fetchFn(`${requireApiUrl()}/account/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
      } catch {
        // Best-effort: o logout do front não falha se a API .NET estiver indisponível.
      }

      try {
        await supabaseAdmin.auth.signOut();
      } catch {
        // Idem — não bloqueia o logout local.
      }
    }

    session.destroy();
    return res.status(200).json({ ok: true });
  });

  router.get('/session', async (req, res) => {
    const session = await getValidSession(req, res, supabaseAdmin);
    if (!session?.accessToken) {
      return res.status(200).json({ authenticated: false });
    }

    const payload = JSON.parse(
      Buffer.from(session.accessToken.split('.')[1], 'base64url').toString('utf8'),
    );
    const nome = payload.user_metadata?.name as string | undefined;

    return res
      .status(200)
      .json({ authenticated: true, email: payload.email, nome: nome ?? payload.email });
  });

  return router;
}
