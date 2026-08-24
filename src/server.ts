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

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

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
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * O dev local roda em HTTPS com os certs self-signed de ssl/ (mesmos usados pelo `ng serve --ssl`
 * hoje), pra manter paridade de origem/cookies Secure entre os dois workflows de dev.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  // Porta diferente da do `ng serve` (4200) pra permitir rodar os dois workflows de dev juntos
  // (npm run start:dev) sem conflito de porta.
  const port = Number(process.env['PORT']) || 4300;
  const sslCertPath = process.env['SSL_CERT_PATH'] ?? 'ssl/dev-server.crt';
  const sslKeyPath = process.env['SSL_KEY_PATH'] ?? 'ssl/dev-server.key';

  let httpsOptions: { cert: Buffer; key: Buffer } | undefined;
  try {
    httpsOptions = { cert: readFileSync(sslCertPath), key: readFileSync(sslKeyPath) };
  } catch {
    httpsOptions = undefined;
  }

  if (httpsOptions) {
    createHttpsServer(httpsOptions, app).listen(port, () => {
      console.log(`Node Express server (SSR) listening on https://localhost:${port}`);
    });
  } else {
    app.listen(port, (error) => {
      if (error) {
        throw error;
      }

      console.log(`Node Express server (SSR) listening on http://localhost:${port}`);
    });
  }
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
