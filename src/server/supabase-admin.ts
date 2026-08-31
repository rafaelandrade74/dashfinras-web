import { createClient, SupabaseClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente '${name}' não definida — necessária para o BFF de auth.`);
  }
  return value;
}

let cachedClient: SupabaseClient | undefined;

// Criação preguiçosa (não no top-level do módulo) pra não exigir as env vars só por importar este
// arquivo — importa em testes que injetam um client fake via createApiApp({ supabaseAdmin }).
export function getSupabaseAdmin(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}
