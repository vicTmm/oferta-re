"use server";
import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { workspaceContext } from "@/lib/workspace";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function admin(f: FormData) {
  const id = String(f.get("org") ?? "");
  if (!uuid.test(id)) redirect("/workspace?erro=acesso");
  const ctx = await workspaceContext(id);
  if (!ctx.canManage) redirect(`/workspace/equipe?org=${id}&erro=permissao`);
  return ctx;
}
function finish(org: string, error = false) {
  redirect(
    `/workspace/equipe?org=${org}&${error ? "erro=validacao" : "sucesso=1"}`,
  );
}
export async function createDepartment(f: FormData) {
  const { client, org } = await admin(f);
  const name = String(f.get("name") ?? "").trim(),
    area = String(f.get("area") ?? "");
  if (
    name.length < 2 ||
    name.length > 100 ||
    !["treaty", "facultative", "other"].includes(area)
  )
    finish(org.id, true);
  const { error } = await client
    .from("departments")
    .insert({ organization_id: org.id, name, area });
  finish(org.id, !!error);
}
export async function inviteMember(
  f: FormData,
): Promise<{ error?: string; url?: string }> {
  const { client, org, role } = await admin(f);
  const email = String(f.get("email") ?? "")
      .trim()
      .toLowerCase(),
    memberRole = String(f.get("role") ?? ""),
    department = String(f.get("department_id") ?? "");
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    !["admin", "member", "viewer"].includes(memberRole) ||
    (memberRole === "admin" && role !== "owner") ||
    (department && !uuid.test(department))
  )
    return { error: "Confira o e-mail, o papel e o setor." };
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  const { error } = await client.rpc("create_company_invitation", {
    p_org: org.id,
    p_email: email,
    p_role: memberRole,
    p_department: department || null,
    p_hash: hash,
  });
  if (error) return { error: "Não foi possível criar o convite." };
  return {
    url: `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? ""}/convite#${token}`,
  };
}
export async function assignDepartment(f: FormData) {
  const { client, org } = await admin(f);
  const department = String(f.get("department_id") ?? ""),
    user = String(f.get("user_id") ?? "");
  if (!uuid.test(department) || !uuid.test(user)) finish(org.id, true);
  const { error } = await client.rpc("assign_department_member", {
    p_org: org.id,
    p_department: department,
    p_user: user,
  });
  finish(org.id, !!error);
}
export async function revokeInvitation(f: FormData) {
  const { client, org } = await admin(f);
  const id = String(f.get("id") ?? "");
  if (!uuid.test(id)) finish(org.id, true);
  const { error } = await client.rpc("revoke_company_invitation", {
    p_org: org.id,
    p_id: id,
  });
  finish(org.id, !!error);
}
