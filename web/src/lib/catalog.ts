import 'server-only';
import { createClient } from '@supabase/supabase-js';
import local from './public-catalog.json';
import { supabaseConfig } from './supabase/config';
export type Reinsurer = Record<string, string>;
export type Catalog = {
  records: Reinsurer[];
  collectedAt: string | null;
  mode: 'local' | 'supabase';
  failed: boolean;
  unavailable: boolean;
};
export async function getCatalog(): Promise<Catalog> {
  const config = supabaseConfig();
  if (!config) return { records: local.records, collectedAt: local.collectedAt, mode: 'local', failed: false, unavailable: false };
  const client = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    // Seleciona uma execução primeiro. Paginação fixa neste run_id evita misturar
    // snapshots caso o coletor publique enquanto carregamos as páginas.
    const { data: runs, error: runError } = await client.from('collection_runs')
      .select('id,status,finished_at').order('finished_at', { ascending: false }).order('run_key', { ascending: false }).limit(1);
    if (runError) throw runError;
    const { data: validated, error: validatedError } = await client.from('collection_runs')
      .select('id,finished_at').eq('status', 'validated').order('finished_at', { ascending: false }).order('run_key', { ascending: false }).limit(1);
    if (validatedError) throw validatedError;
    const latest = validated?.[0];
    const records: Reinsurer[] = [];
    if (latest) {
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await client.from('reinsurer_snapshots').select('record')
          .eq('run_id', latest.id).order('monitoring_key').range(offset, offset + 999);
        if (error) throw error;
        records.push(...(data ?? []).map(row => row.record as Reinsurer));
        if (!data || data.length < 1000) break;
      }
    }
    return { records, collectedAt: latest?.finished_at ?? null, mode: 'supabase', failed: runs?.[0]?.status === 'failed', unavailable: false };
  } catch {
    // Não troca uma conexão quebrada por dados locais sem avisar o visitante.
    return { records: [], collectedAt: null, mode: 'supabase', failed: false, unavailable: true };
  }
}
