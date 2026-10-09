import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { createIngestionHandler } from './handler.ts';
import { INGESTION_TOKEN_SHA256 } from './token-hash.ts';

// verify_jwt=false: o handler verifica uma chave dedicada de ingestão.
// O JWT de um usuário comum não dá acesso a este endpoint.
Deno.serve(createIngestionHandler(INGESTION_TOKEN_SHA256, async (name, payload) => {
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession:false, autoRefreshToken:false }
  });
  return await client.rpc(name, payload);
}));
