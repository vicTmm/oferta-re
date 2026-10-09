"use server";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { workspaceContext } from "@/lib/workspace";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function value(f: FormData, k: string, max: number, required = true) {
  const v = String(f.get(k) ?? "").trim();
  if ((required && !v) || v.length > max) throw new Error("validacao");
  return v;
}
function department(f: FormData) {
  const id = String(f.get("department_id") ?? "");
  if (id && !uuid.test(id)) throw Error("validacao");
  return id || null;
}
async function context(f: FormData) {
  const org = String(f.get("org") ?? "");
  if (!uuid.test(org)) redirect("/workspace?erro=validacao");
  const ctx = await workspaceContext(org);
  if (!ctx.canWrite) redirect(`/workspace?org=${org}&erro=permissao`);
  return ctx;
}
function done(path: string, org: string, error?: string) {
  redirect(
    `/workspace${path}?org=${org}&${error ? "erro=" + error : "sucesso=1"}`,
  );
}
export async function saveContact(f: FormData) {
  const { client, org } = await context(f);
  let error = false;
  try {
    const email = value(f, "email", 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error();
    const key = value(f, "reinsurer_key", 160);
    const { data: valid } = await client
      .from("latest_public_reinsurers")
      .select("record")
      .eq("monitoring_key", key)
      .limit(1);
    if (!valid?.length) throw Error();
    const id = String(f.get("id") ?? "");
    if (id && !uuid.test(id)) throw Error();
    const row = {
      organization_id: org.id,
      department_id: department(f),
      name: value(f, "name", 120),
      email: email.toLowerCase(),
      reinsurer_key: key,
      specialties: value(f, "specialties", 500, false)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      source_note: value(f, "source_note", 1000, false),
    };
    const result = id
      ? await client
          .from("contacts")
          .update(row)
          .eq("id", id)
          .eq("organization_id", org.id)
          .select("id")
          .single()
      : await client.from("contacts").insert(row);
    error = !!result.error;
  } catch {
    error = true;
  }
  done("/contatos", org.id, error ? "validacao" : undefined);
}
export async function saveTemplate(f: FormData) {
  const { client, org } = await context(f);
  let error = false;
  try {
    const id = value(f, "id", 36, false);
    if (id && !uuid.test(id)) throw Error();
    const { error: e } = await client.rpc("save_email_template", {
      p_org: org.id,
      p_department: department(f),
      p_template: id || null,
      p_name: value(f, "name", 120),
      p_subject: value(f, "subject", 300),
      p_body: value(f, "body", 20000),
      p_signature: value(f, "signature", 5000, false),
    });
    error = !!e;
  } catch {
    error = true;
  }
  done("/modelos", org.id, error ? "validacao" : undefined);
}
export async function prepareOffer(f: FormData) {
  const { client, org } = await context(f);
  let op: string | null = null;
  try {
    const contacts = [...new Set(f.getAll("contacts").map(String))];
    if (
      !contacts.length ||
      contacts.length > 100 ||
      contacts.some((id) => !uuid.test(id))
    )
      throw Error();
    const template = value(f, "template_version_id", 36, false);
    if (template && !uuid.test(template)) throw Error();
    const subject = value(f, "subject", 300),
      body = value(f, "body", 20000),
      signature = value(f, "signature", 5000, false);
    if (/\{\{[^}]+\}\}/.test(subject + body + signature)) throw Error();
    const existing = value(f, "operation_id", 36, false),
      offer = value(f, "offer_id", 36, false);
    if ((existing && !uuid.test(existing)) || (offer && !uuid.test(offer)))
      throw Error();
    const result = existing
      ? await client.rpc("prepare_proposal_offer", {
          p_org: org.id,
          p_operation: existing,
          p_offer: offer || null,
          p_template: template || null,
          p_subject: subject,
          p_body: body,
          p_signature: signature,
          p_contacts: contacts,
        })
      : await client.rpc("prepare_offer", {
          p_org: org.id,
          p_department: department(f),
          p_reference: value(f, "reference", 120),
          p_title: value(f, "title", 200),
          p_cedent: value(f, "cedent_name", 200),
          p_contract: value(f, "contract_reference", 120, false),
          p_template: template || null,
          p_subject: subject,
          p_body: body,
          p_signature: signature,
          p_contacts: contacts,
        });
    const { data, error } = result;
    if (!error) op = data;
  } catch {
    /* detalhes privados não entram na URL */
  }
  if (!op) done("/propostas", org.id, "validacao");
  redirect(`/workspace/propostas/${op}?org=${org.id}&sucesso=1`);
}
export async function authorizeUpload(
  f: FormData,
): Promise<{ error?: string; path?: string; token?: string }> {
  const { client, org } = await context(f);
  try {
    const operation = value(f, "operation_id", 36),
      recipient = value(f, "recipient_id", 36, false),
      existing = value(f, "document_id", 36, false);
    const hash = value(f, "sha256", 64),
      size = Number(f.get("size_bytes"));
    if (
      !uuid.test(operation) ||
      (recipient && !uuid.test(recipient)) ||
      (existing && !uuid.test(existing)) ||
      !/^[0-9a-f]{64}$/.test(hash) ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 26214400
    )
      throw Error();
    const id = existing || randomUUID(),
      path = `${org.id}/${operation}/${id}`;
    if (existing) {
      const { data: d } = await client
        .from("documents")
        .select("sha256,operation_id,storage_path,size_bytes")
        .eq("organization_id", org.id)
        .eq("id", id)
        .single();
      if (
        !d ||
        d.sha256 !== hash ||
        d.operation_id !== operation ||
        d.storage_path !== path ||
        d.size_bytes !== size
      )
        throw Error();
    } else {
      const kind = value(f, "kind", 30);
      if (
        !["attachment", "sending_evidence", "response", "other"].includes(kind)
      )
        throw Error();
      const { error } = await client.from("documents").insert({
        id,
        organization_id: org.id,
        operation_id: operation,
        recipient_id: recipient || null,
        kind,
        original_name: value(f, "original_name", 255),
        storage_path: path,
        sha256: hash,
        size_bytes: size,
        media_type:
          value(f, "media_type", 120, false) || "application/octet-stream",
      });
      if (error) throw Error();
    }
    const { data, error } = await client.storage
      .from("operation-documents")
      .createSignedUploadUrl(path, { upsert: false });
    if (error || !data) throw Error();
    return { path, token: data.token };
  } catch {
    return {
      error:
        "Não foi possível autorizar o arquivo. Confira a operação e as permissões. Se o registro foi criado, use Reenviar arquivo.",
    };
  }
}
export async function recordResponse(f: FormData) {
  const { client, org } = await context(f);
  let failed = false;
  let reason = "validacao";
  try {
    const recipient = value(f, "recipient_id", 36),
      doc = value(f, "document_id", 36);
    if (!uuid.test(recipient) || !uuid.test(doc)) throw Error();
    const classification = value(f, "classification", 30);
    if (
      ![
        "information_request",
        "declined",
        "accepted_partial",
        "accepted_total",
        "other",
        "unconfirmed",
      ].includes(classification)
    )
      throw Error();
    const received = value(f, "received_at", 30, false);
    const receivedDate = received ? new Date(received + "-03:00") : null;
    if (receivedDate && !Number.isFinite(receivedDate.getTime())) throw Error();
    const { error } = await client.from("responses").insert({
      organization_id: org.id,
      recipient_id: recipient,
      document_id: doc || null,
      classification,
      note: value(f, "note", 2000, false),
      responded_at: receivedDate?.toISOString() ?? null,
    });
    failed = !!error;
    if (error?.message.includes("upload do comprovante"))
      reason = "comprovante";
  } catch {
    failed = true;
  }
  done("/comprovantes", org.id, failed ? reason : undefined);
}
export async function confirmSending(f: FormData) {
  const { client, org } = await context(f);
  let failed = false;
  try {
    if (f.get("confirmed") !== "on") throw Error();
    const id = value(f, "recipient_id", 36);
    if (!uuid.test(id)) throw Error();
    const { error } = await client
      .from("offer_recipients")
      .update({ status: "sent_confirmed", sent_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", org.id)
      .eq("status", "prepared")
      .select("id")
      .single();
    failed = !!error;
  } catch {
    failed = true;
  }
  const op = value(f, "operation_id", 36);
  if (!uuid.test(op)) done("/propostas", org.id, "validacao");
  done(`/propostas/${op}`, org.id, failed ? "validacao" : undefined);
}
