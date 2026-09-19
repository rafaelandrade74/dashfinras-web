import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSession, getValidSession, decodeJwtExp, configurarSessao } from './session';

export interface AuthRouterDeps {
  supabaseAdmin: Pick<SupabaseClient, 'auth'>;
}

function errorCode(message: string | undefined): string {
  if (message === 'Invalid login credentials') return 'invalid_credentials';
  if (message?.toLowerCase().includes('already registered')) return 'already_registered';
  return 'unknown';
}

/**
 * Cria o router de auth do BFF, com as dependências (client Supabase) injetadas em vez de
 * importadas como singleton — permite testar a lógica com dublês, sem mocking de módulo.
 *
 * A API .NET (api-dashfinras) valida o JWT do Supabase diretamente via Authorization: Bearer
 * (ver docs/08-authentication.md no repo da API) — não há mais troca de sessão servidor-a-servidor
 * (POST account/login/logout foram removidos da API em 2026-08-24, spec
 * 002-remove-login-logout-endpoints). O BFF só fala com o Supabase Auth e guarda o token no cookie
 * httpOnly; api-proxy.ts injeta esse mesmo token como Bearer nas chamadas a /api/*.
 */
export function createAuthRouter({ supabaseAdmin }: AuthRouterDeps): Router {
  const router = Router();

  router.post('/login', async (req, res) => {
    const { email, password, manterLogado } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ code: 'invalid_request' });
    }

    // Só `true` booleano conta como marcado — qualquer outro valor (ausente, string, etc.) é
    // tratado como não persistente, por segurança.
    const persistente = manterLogado === true;

    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        return res.status(401).json({ code: errorCode(error?.message) });
      }

      const session = await getSession(req, res);
      configurarSessao(session, persistente);
      session.accessToken = data.session.access_token;
      session.refreshToken = data.session.refresh_token;
      session.expiresAt = decodeJwtExp(data.session.access_token);
      session.persistente = persistente;
      session.lastActivityAt = Math.floor(Date.now() / 1000);
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
        // Login automático após cadastro: o usuário não viu o checkbox "Manter-se logado", então
        // a sessão nasce não persistente (FR-008).
        const session = await getSession(req, res);
        configurarSessao(session, false);
        session.accessToken = data.session.access_token;
        session.refreshToken = data.session.refresh_token;
        session.expiresAt = decodeJwtExp(data.session.access_token);
        session.persistente = false;
        session.lastActivityAt = Math.floor(Date.now() / 1000);
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
        await supabaseAdmin.auth.signOut();
      } catch {
        // Best-effort — não bloqueia o logout local se o Supabase estiver indisponível.
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
