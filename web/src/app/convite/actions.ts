"use server";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
export async function acceptInvitation(f: FormData) {
  const client = await serverSupabase();
  if (!client) redirect("/entrar");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/entrar");
  const token = String(f.get("token") ?? "");
  if (!/^[0-9a-f]{64}$/.test(token))
    return { error: "Confira o código do convite." };
  const { data, error } = await client.rpc("accept_company_invitation", {
    p_token: token,
  });
  if (error)
    return {
      error:
        "Convite indisponível. Confirme o e-mail da conta ou solicite um novo link ao administrador.",
    };
  redirect(`/workspace?org=${data}`);
}
