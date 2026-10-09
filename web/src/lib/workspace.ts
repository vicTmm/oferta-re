import "server-only";
import { redirect } from "next/navigation";
import { serverSupabase } from "./supabase/server";
export async function workspaceContext(orgId?: string) {
  const client = await serverSupabase();
  if (!client) redirect("/entrar");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: orgs, error } = await client
    .from("organizations")
    .select("id,name")
    .order("created_at");
  if (error) throw new Error("Não foi possível carregar a corretora.");
  if (!orgs?.length) redirect("/workspace");
  const org = orgId ? orgs.find((o) => o.id === orgId) : orgs[0];
  if (!org) redirect("/workspace?erro=acesso");
  const { data: membership } = await client
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .single();
  const departments=checked(await client.from("departments").select("id,name,area").eq("organization_id",org.id).order("name"))??[];
  return {
    departments,
    client,
    user,
    org,
    orgs,
    role: membership?.role,
    canManage: !!membership && ["owner", "admin"].includes(membership.role),
    canWrite:
      !!membership && ["owner", "admin", "member"].includes(membership.role),
  };
}
export function checked<T>(result: { data: T; error: unknown }): T {
  if (result.error)
    throw new Error("Não foi possível carregar os registros. Tente novamente.");
  return result.data;
}
