import 'dotenv/config';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import { join } from 'node:path';
import { createApiApp } from './server/create-api-app';
import { forceHttps } from './server/force-https';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

const sslCertPath = process.env['SSL_CERT_PATH'] ?? 'ssl/dev-server.crt';
const sslKeyPath = process.env['SSL_KEY_PATH'] ?? 'ssl/dev-server.key';
let httpsOptions: { cert: Buffer; key: Buffer } | undefined;
try {
  httpsOptions = { cert: readFileSync(sslCertPath), key: readFileSync(sslKeyPath) };
} catch {
  httpsOptions = undefined;
}

// Explícito, não inferido: sem certs locais não significa necessariamente "tem proxy na frente"
// — pode ser só rodando local em HTTP puro sem TLS nenhum (ex.: teste rápido do build). Inferir
// isso da ausência de certs quebrava esse caso: o servidor forçava redirect pra https:// mesmo
// sem nada escutando lá. BEHIND_PROXY precisa ser setado explicitamente em produção.
const behindProxy = process.env['BEHIND_PROXY'] === 'true';

if (behindProxy) {
  // 1 hop de proxy (a maioria dos setups: um load balancer/reverse proxy só na frente) — sem
  // isso, req.secure nunca reflete X-Forwarded-Proto e o redirect abaixo vira um loop infinito.
  app.set('trust proxy', 1);
  app.use(forceHttps());
}

const angularApp = new AngularNodeAppEngine(
  behindProxy ? { trustProxyHeaders: ['x-forwarded-proto', 'x-forwarded-host'] } : undefined,
);

/**
 * Rotas /api do BFF (auth + proxy pro api-dashfinras) — ver src/server/create-api-app.ts.
 * Registradas antes do catch-all do AngularNodeAppEngine abaixo. Instanciado sob demanda (não no
 * carregamento do módulo) porque o build do Angular carrega este arquivo pra extrair as rotas do
 * servidor (app.routes.server.ts) sem ter as env vars do BFF disponíveis nesse momento — só em
 * runtime.
 */
let apiApp: express.Express | undefined;
app.use((req, res, next) => {
  apiApp ??= createApiApp();
  apiApp(req, res, next);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Exportado separadamente do app.listen() para ser testável com supertest (src/server/*.spec.ts)
 * sem precisar subir uma porta real.
 */
export { app };

/**
 * Valida as env vars obrigatórias do BFF antes de começar a aceitar requisições — sem isso, a
 * primeira falta só aparecia no meio de uma chamada (ex.: SESSION_COOKIE_SECRET sendo lido só
 * dentro de getValidSession), com um stack trace confuso em vez de uma mensagem clara no boot.
 */
function validateRequiredEnv(): void {
  const missing: string[] = [];

  for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'API_DASHFINRAS_URL']) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  const cookieSecret = process.env['SESSION_COOKIE_SECRET'];
  if (!cookieSecret) {
    missing.push('SESSION_COOKIE_SECRET');
  } else if (cookieSecret.length < 32) {
    missing.push(
      'SESSION_COOKIE_SECRET (tem só ' + cookieSecret.length + ' caracteres, precisa de 32+)',
    );
  }

  if (missing.length > 0) {
    console.error(
      `Configuração inválida — variáveis de ambiente ausentes/inválidas: ${missing.join(', ')}.\n` +
        'Copie .env.example para .env e preencha os valores (ver README/CLAUDE.md).',
    );
    process.exit(1);
  }
}

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * O dev local roda em HTTPS com os certs self-signed de ssl/ (mesmos usados pelo `ng serve --ssl`
 * hoje), pra manter paridade de origem/cookies Secure entre os dois workflows de dev. Em produção
 * (sem esses certs), o processo assume que está atrás de um reverse proxy que termina o TLS — ver
 * forceHttps() acima.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  validateRequiredEnv();

  // Porta diferente da do `ng serve` (4200) pra permitir rodar os dois workflows de dev juntos
  // (npm run start:dev) sem conflito de porta.
  const port = Number(process.env['PORT']) || 4300;

  if (httpsOptions) {
    createHttpsServer(httpsOptions, app).listen(port, () => {
      console.log(`Node Express server (SSR) listening on https://localhost:${port}`);
    });
  } else {
    app.listen(port, (error) => {
      if (error) {
        throw error;
      }

      const suffix = behindProxy
        ? ' (atrás de proxy, HTTPS forçado via X-Forwarded-Proto)'
        : ' (HTTP puro, sem TLS — defina BEHIND_PROXY=true se houver um reverse proxy na frente)';
      console.log(`Node Express server (SSR) listening on http://localhost:${port}${suffix}`);
    });
  }
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
