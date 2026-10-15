"use server";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
export async function signIn(form: FormData) {
  const client = await serverSupabase();
  if (!client) redirect("/entrar?erro=configuracao");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) redirect("/entrar?erro=credenciais");
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error)
    redirect(
      `/entrar?erro=${error.code === "email_not_confirmed" ? "confirmacao" : error.status === 429 ? "limite" : "credenciais"}`,
    );
  redirect("/workspace");
}
export async function signOut() {
  const client = await serverSupabase();
  await client?.auth.signOut();
  redirect("/");
}
export async function signUp(form: FormData) {
  const client = await serverSupabase();
  if (!client) redirect("/cadastro?erro=configuracao");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || password.length < 12) redirect("/cadastro?erro=dados");
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) redirect("/cadastro?erro=configuracao");
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin.replace(/\/$/, "")}/auth/callback` },
  });
  if (error) redirect("/cadastro?erro=dados");
  if (data.session) redirect("/workspace");
  redirect("/cadastro?confirmacao=1");
}

export async function requestPasswordReset(form: FormData) {
  const client = await serverSupabase();
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!client || !origin) redirect("/recuperar-senha?erro=configuracao");
  const email = String(form.get("email") ?? "").trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    redirect("/recuperar-senha?erro=dados");
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin.replace(/\/$/, "")}/auth/callback?next=/redefinir-senha`,
  });
  if (error)
    redirect(
      `/recuperar-senha?erro=${error.status === 429 ? "limite" : "envio"}`,
    );
  // A resposta é igual para contas existentes e inexistentes.
  redirect("/recuperar-senha?enviado=1");
}

export async function updatePassword(form: FormData) {
  const client = await serverSupabase();
  if (!client) redirect("/entrar?erro=configuracao");
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) redirect("/recuperar-senha?erro=link");
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (
    password.length < 12 ||
    password.length > 128 ||
    password !== confirmation
  )
    redirect("/redefinir-senha?erro=dados");
  const { error } = await client.auth.updateUser({ password });
  if (error) redirect("/redefinir-senha?erro=senha");
  // Encerra somente a sessão usada na recuperação, sem desconectar outros dispositivos.
  const { error: signOutError } = await client.auth.signOut({ scope: "local" });
  if (signOutError) redirect("/workspace");
  redirect("/entrar?senha=atualizada");
}
