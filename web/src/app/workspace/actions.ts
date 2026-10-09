"use server";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
export async function createOrganization(form: FormData) {
  const client = await serverSupabase();
  if (!client) redirect("/entrar");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/entrar");
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 120) redirect("/workspace?erro=nome");
  const { data, error } = await client.rpc("create_organization", {
    p_name: name,
  });
  if (error) redirect("/workspace?erro=criacao");
  redirect(`/workspace/ativacao?org=${data}`);
}
