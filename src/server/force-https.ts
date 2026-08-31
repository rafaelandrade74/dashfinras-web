import type { RequestHandler } from 'express';

/**
 * Força HTTPS quando o app roda atrás de um reverse proxy que termina o TLS (produção) — o Node
 * em si só fala HTTP com o proxy, então a informação de "a conexão original era HTTPS" vem do
 * header `X-Forwarded-Proto`. Depende de `app.set('trust proxy', ...)` estar configurado (ver
 * server.ts), senão `req.secure` nunca reflete esse header e isso vira um no-op perigoso.
 *
 * O cookie de sessão (df_session) é `Secure` — sem HTTPS de ponta a ponta ele nem chega a ser
 * setado/enviado, mas sem esse redirect o POST de login (com a senha) ainda viajaria em texto
 * claro até esse ponto se alguém acessasse via http:// através do proxy.
 */
export function forceHttps(): RequestHandler {
  return (req, res, next) => {
    if (req.secure) {
      // HSTS: instrui o browser a nunca mais tentar http:// nesse domínio, mesmo que alguém
      // digite a URL sem o https:// da próxima vez.
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      return next();
    }

    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  };
}
