import { NextResponse, type NextRequest } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
export async function GET(request: NextRequest) {
  const client = await serverSupabase();
  const code = request.nextUrl.searchParams.get('code');
  if (client && code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/workspace', request.url));
  }
  return NextResponse.redirect(new URL('/entrar?erro=credenciais', request.url));
}
