'use server';
import { redirect } from 'next/navigation';
import { serverSupabase } from '@/lib/supabase/server';
export async function signIn(form: FormData) {
  const client = await serverSupabase();
  if (!client) redirect('/entrar?erro=configuracao');
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) redirect('/entrar?erro=credenciais');
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect('/entrar?erro=credenciais');
  redirect('/workspace');
}
export async function signOut() {
  const client = await serverSupabase();
  await client?.auth.signOut();
  redirect('/');
}
export async function signUp(form: FormData) {
  const client = await serverSupabase();
  if (!client) redirect('/cadastro?erro=configuracao');
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || password.length < 12) redirect('/cadastro?erro=dados');
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) redirect('/cadastro?erro=configuracao');
  const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${origin.replace(/\/$/, '')}/auth/callback` } });
  if (error) redirect('/cadastro?erro=dados');
  if (data.session) redirect('/workspace');
  redirect('/cadastro?confirmacao=1');
}
