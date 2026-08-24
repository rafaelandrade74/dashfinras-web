import { getIronSession, IronSession } from 'iron-session';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

function requireCookieSecret(): string {
  const secret = process.env['SESSION_COOKIE_SECRET'];
  if (!secret || secret.length < 32) {
    throw new Error(
      "Variável de ambiente 'SESSION_COOKIE_SECRET' precisa ter pelo menos 32 caracteres — usada para criptografar o cookie de sessão.",
    );
  }
  return secret;
}

// Quanto tempo o cookie df_session sobrevive no navegador antes de exigir login de novo,
// independente do access_token individual expirar antes disso (esses são renovados
// automaticamente via refresh_token em getValidSession, enquanto o cookie em si for válido).
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

export function sessionOptions() {
  return {
    cookieName: 'df_session',
    password: requireCookieSecret(),
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
    },
  };
}

export function getSession(req: Request, res: Response): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions());
}

// Extrai o "exp" (segundos desde epoch) do access_token sem validar assinatura — só usado pra
// decidir se vale a pena tentar um refresh antes de repassar a chamada; a validação de verdade é
// feita pela API .NET (JwtBearer) quando o token é usado.
export function decodeJwtExp(token: string): number | undefined {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json).exp;
  } catch {
    return undefined;
  }
}

const EXPIRY_SKEW_SECONDS = 60;

/**
 * Retorna a sessão com um access_token válido, renovando via refresh_token quando necessário.
 * Usada tanto por GET /api/auth/session quanto pelo proxy genérico, para não duplicar a lógica
 * de refresh. Se não houver sessão ou o refresh falhar, destrói o cookie e retorna null.
 *
 * `supabaseAdmin` é injetado (em vez de importado como singleton) pra permitir testar essa lógica
 * com um client Supabase fake, sem mocking de módulo.
 */
export async function getValidSession(
  req: Request,
  res: Response,
  supabaseAdmin: Pick<SupabaseClient, 'auth'>,
): Promise<IronSession<SessionData> | null> {
  const session = await getSession(req, res);

  if (!session.accessToken || !session.refreshToken) {
    return null;
  }

  const exp = session.expiresAt ?? decodeJwtExp(session.accessToken);
  const nowSeconds = Date.now() / 1000;

  if (exp && exp - nowSeconds > EXPIRY_SKEW_SECONDS) {
    return session;
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: session.refreshToken,
  });

  if (error || !data.session) {
    session.destroy();
    return null;
  }

  session.accessToken = data.session.access_token;
  session.refreshToken = data.session.refresh_token;
  session.expiresAt = decodeJwtExp(data.session.access_token);
  await session.save();

  return session;
}
