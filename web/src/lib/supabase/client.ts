'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from './config';
export function browserSupabase() {
  const config = supabaseConfig();
  if (!config) throw new Error('Conecte o projeto Supabase para acessar a área privada.');
  return createBrowserClient(config.url, config.key);
}
