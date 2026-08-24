import express, { Express } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthRouter } from './auth';
import { createApiProxy } from './api-proxy';
import { getSupabaseAdmin } from './supabase-admin';

export interface CreateApiAppOptions {
  supabaseAdmin?: Pick<SupabaseClient, 'auth'>;
  fetchFn?: typeof fetch;
}

/**
 * Monta só as rotas /api do BFF (auth + proxy pro api-dashfinras), sem a engine de SSR do
 * Angular — extraído à parte pra ser testável com supertest sem depender do dist do Angular
 * (ver server.ts, que monta esse app antes do catch-all do AngularNodeAppEngine).
 *
 * As dependências (client Supabase, fetch) são injetáveis, com defaults reais — permite testar a
 * lógica de auth/proxy com dublês, sem mocking de módulo (bloqueado pelo test runner do Angular
 * para imports relativos).
 */
export function createApiApp(options: CreateApiAppOptions = {}): Express {
  const supabaseAdmin = options.supabaseAdmin ?? getSupabaseAdmin();
  const fetchFn = options.fetchFn ?? fetch;

  const app = express();

  app.use('/api/auth', express.json(), createAuthRouter({ supabaseAdmin, fetchFn }));
  app.use('/api', createApiProxy(supabaseAdmin));

  return app;
}
