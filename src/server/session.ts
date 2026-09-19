import { getIronSession, IronSession } from 'iron-session';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  // Escolha feita no login ("Manter-se logado"). undefined = sessão criada antes desta feature
  // (comportamento legado: ttl fixo de 14 dias, sem as regras de inatividade abaixo).
  persistente?: boolean;
  // Epoch em segundos do último uso reconhecido (ver registrarAtividade). Junto com `persistente`,
  // determina se a sessão está expirada por inatividade (ver sessaoExpiradaPorInatividade).
  lastActivityAt?: number;
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

// Prazo de inatividade tolerado quando o usuário marca "Manter-se logado" no login: a sessão
// expira só depois de 3 dias sem uso, renovados a cada uso (prazo deslizante — ver
// registrarAtividade/sessaoExpiradaPorInatividade). Sessões criadas antes desta feature (sem o
// campo `persistente`) continuam usando o ttl legado de 14 dias fixos — ver LEGACY_TTL_SECONDS.
const PERSISTENT_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 dias

// Prazo de inatividade da sessão quando "Manter-se logado" NÃO é marcado: além de o cookie ser de
// sessão do navegador (some ao fechar — ver configurarSessao), o servidor também exige uso a cada
// 1 hora, mesmo com a aba aberta.
const IDLE_TTL_SECONDS = 60 * 60; // 1 hora

// Ttl usado apenas para sessões legadas (persistente === undefined, criadas antes desta feature).
// Mantém o comportamento anterior à mudança para não invalidar sessões já emitidas (FR-006). Este
// ramo pode ser removido 14 dias após o deploy desta feature.
const LEGACY_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

// Intervalo mínimo entre regravações do cookie por atividade (registrarAtividade), para não emitir
// um Set-Cookie a cada requisição autenticada.
const ACTIVITY_THROTTLE_SECONDS = 60;

export function sessionOptions() {
  return {
    cookieName: 'df_session',
    password: requireCookieSecret(),
    ttl: LEGACY_TTL_SECONDS,
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

/**
 * Aplica a configuração de cookie/ttl correta para o modo persistente ou não persistente. Deve ser
 * chamada sempre que a sessão for salva (login, signup, renovação de token), para que uma sessão
 * não persistente nunca vire persistente e vice-versa (FR-005).
 *
 * Persistente: ttl de 3 dias, Max-Age normal (iron-session calcula a partir do ttl).
 * Não persistente: cookieOptions.maxAge explicitamente undefined — no iron-session 8.0.4 isso zera
 * o ttl do selo e faz o cookie virar "de sessão" do navegador (sem Max-Age/Expires), em vez de
 * usar o Max-Age calculado a partir do ttl padrão.
 */
export function configurarSessao(session: IronSession<SessionData>, persistente: boolean): void {
  const base = sessionOptions();

  if (persistente) {
    session.updateConfig({ ...base, ttl: PERSISTENT_TTL_SECONDS });
    return;
  }

  session.updateConfig({
    ...base,
    cookieOptions: { ...base.cookieOptions, maxAge: undefined },
  });
}

/**
 * Verifica se a sessão está expirada por inatividade, de acordo com o modo:
 * - persistente=true: expira após PERSISTENT_TTL_SECONDS (3 dias) sem uso.
 * - persistente=false: expira após IDLE_TTL_SECONDS (1 hora) sem uso.
 * - persistente===undefined (sessão legada): nunca expira por esta regra — vale só o ttl do selo
 *   (LEGACY_TTL_SECONDS), que o próprio iron-session já aplica ao desselar o cookie.
 */
export function sessaoExpiradaPorInatividade(
  session: Pick<SessionData, 'persistente' | 'lastActivityAt'>,
  agoraSegundos: number,
): boolean {
  if (session.persistente === undefined || session.lastActivityAt === undefined) {
    return false;
  }

  const limite = session.persistente ? PERSISTENT_TTL_SECONDS : IDLE_TTL_SECONDS;
  return agoraSegundos - session.lastActivityAt > limite;
}

/**
 * Atualiza lastActivityAt e regrava o cookie (prazo deslizante), no máximo a cada
 * ACTIVITY_THROTTLE_SECONDS — evita um Set-Cookie por requisição autenticada. Sessões legadas
 * (persistente undefined) não têm a atividade registrada: seguem valendo só o ttl fixo do selo.
 */
export async function registrarAtividade(
  session: IronSession<SessionData>,
  agoraSegundos: number,
): Promise<void> {
  if (session.persistente === undefined) {
    return;
  }

  if (
    session.lastActivityAt !== undefined &&
    agoraSegundos - session.lastActivityAt < ACTIVITY_THROTTLE_SECONDS
  ) {
    return;
  }

  configurarSessao(session, session.persistente);
  session.lastActivityAt = agoraSegundos;
  await session.save();
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

  // Reaplica a config de cookie correta (persistente/não persistente) a cada leitura — garante que
  // uma sessão não persistente nunca vire persistente, mesmo que o processo tenha reiniciado entre
  // requisições (updateConfig só existe em memória, por chamada).
  if (session.persistente !== undefined) {
    configurarSessao(session, session.persistente);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (sessaoExpiradaPorInatividade(session, nowSeconds)) {
    session.destroy();
    return null;
  }

  const exp = session.expiresAt ?? decodeJwtExp(session.accessToken);

  if (exp && exp - nowSeconds > EXPIRY_SKEW_SECONDS) {
    await registrarAtividade(session, nowSeconds);
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
  // Preserva persistente e reaplica a config correspondente antes de salvar, para o refresh do
  // token nunca promover uma sessão não persistente a persistente (FR-005).
  if (session.persistente !== undefined) {
    configurarSessao(session, session.persistente);
  }
  session.lastActivityAt = nowSeconds;
  await session.save();

  return session;
}
