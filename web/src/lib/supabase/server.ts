import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

export async function serverSupabase() {
  const config = supabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        // Server Components não gravam cookies; o proxy renova a sessão.
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* somente leitura durante renderização */ }
      },
    },
  });
}
