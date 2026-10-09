import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from '@/lib/supabase/config';
export async function proxy(request: NextRequest) {
  const config = supabaseConfig();
  if (!config) return NextResponse.next();
  let response = NextResponse.next({ request });
  const client = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data, error } = await client.auth.getUser();
  if (request.nextUrl.pathname.startsWith('/workspace') && (error || !data.user)) {
    const url = request.nextUrl.clone(); url.pathname = '/entrar';
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/workspace/:path*', '/entrar', '/auth/:path*', '/convite'] };
