"use server";
import { redirect } from "next/navigation";
import { workspaceContext } from "@/lib/workspace";
import { businessKinds, proposalStages } from "@/lib/proposals";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(f: FormData, key: string, max: number, required = false) {
  const v = String(f.get(key) ?? "").trim();
  if (v.length > max || (required && !v)) throw Error();
  return v;
}
function optionalId(f: FormData, key: string) {
  const v = text(f, key, 36);
  if (v && !uuid.test(v)) throw Error();
  return v || null;
}
function date(f: FormData, key: string) {
  const v = text(f, key, 10);
  if (
    v &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(v) ||
      !Number.isFinite(Date.parse(v)) ||
      new Date(v).toISOString().slice(0, 10) !== v)
  )
    throw Error();
  return v || null;
}
export async function saveProposal(f: FormData) {
  const orgId = String(f.get("org") ?? "");
  if (!uuid.test(orgId)) redirect("/workspace?erro=validacao");
  const { client, org, canWrite } = await workspaceContext(orgId);
  if (!canWrite) redirect(`/workspace/propostas?org=${org.id}&erro=permissao`);
  const selectedTemplate = String(f.get("initial_template") ?? "");
  let result: string | null = null;
  let id: string | null = null;
  let conflict = false;
  try {
    id = optionalId(f, "id");
    const revision = Number(text(f, "revision", 10, true)),
      kind = text(f, "business_kind", 20, true),
      stage = text(f, "stage", 20, true);
    if (
      !Number.isSafeInteger(revision) ||
      revision < 0 ||
      !Object.hasOwn(businessKinds, kind) ||
      !Object.hasOwn(proposalStages, stage)
    )
      throw Error();
    const start = date(f, "coverage_start"),
      end = date(f, "coverage_end");
    if (start && end && end < start) throw Error();
    const { data, error } = await client.rpc("save_proposal", {
      p_org: org.id,
      p_id: id,
      p_revision: revision,
      p_reference: text(f, "reference", 120, true),
      p_title: text(f, "title", 200, true),
      p_cedent: text(f, "cedent_name", 200, true),
      p_contract: text(f, "contract_reference", 120),
      p_kind: kind,
      p_insured: text(f, "insured_name", 200),
      p_department: optionalId(f, "department_id"),
      p_line: optionalId(f, "business_line_id"),
      p_prior: kind === "renewal" ? optionalId(f, "prior_operation_id") : null,
      p_start: start,
      p_end: end,
      p_due: date(f, "due_date"),
      p_next: text(f, "next_action", 1000),
      p_stage: stage,
      p_closure: text(f, "closure_note", 2000),
    });
    if (!error) result = data;
    else conflict = error.message.includes("Recarregue");
  } catch {
    /* Conteúdo privado não entra na URL. */
  }
  if (!result)
    redirect(
      `/workspace/propostas${id ? "/" + id : ""}?org=${org.id}&erro=${conflict ? "conflito" : "validacao"}`,
    );
  redirect(
    `/workspace/propostas/${result}?org=${org.id}&sucesso=1${uuid.test(selectedTemplate) ? `&modelo=${selectedTemplate}` : ""}`,
  );
}
