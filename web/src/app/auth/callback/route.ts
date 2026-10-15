import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { authDestination } from "@/lib/auth-redirect";
export async function GET(request: NextRequest) {
  const client = await serverSupabase();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const destination = authDestination(
    request.nextUrl.searchParams.get("next"),
    type === "recovery",
  );
  if (client && code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  } else if (
    client &&
    tokenHash &&
    (type === "recovery" || type === "email" || type === "signup")
  ) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.redirect(new URL("/entrar?erro=link", request.url));
}
