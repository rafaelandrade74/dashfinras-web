import { RenderMode, ServerRoute } from '@angular/ssr';

// O app continua 100% CSR — o servidor Node só hospeda o shell estático e as rotas de API
// próprias (ver server.ts). RenderMode.Client evita prerender/SSR de verdade das páginas, o que
// quebraria componentes que usam window/document/localStorage num app zoneless.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
