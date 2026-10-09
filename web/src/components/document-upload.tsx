"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { authorizeUpload } from "@/app/workspace/flows";
import { FieldGroup, Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function DocumentUpload({
  org,
  operations,
  recipients,
  initial,
  existing,
}: {
  org: string;
  operations: { id: string; title: string }[];
  recipients: { id: string; name: string; operation: string }[];
  initial?: string;
  existing?: { id: string; operation_id: string; original_name: string };
}) {
  const [operation, setOperation] = useState(
    existing?.operation_id ?? initial ?? operations[0]?.id ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size || file.size > 26214400) {
      setMessage("Escolha um arquivo de até 25 MiB.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        await file.arrayBuffer(),
      );
      data.set(
        "sha256",
        Array.from(new Uint8Array(digest), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join(""),
      );
      data.set("size_bytes", String(file.size));
      data.set("original_name", file.name.slice(0, 255));
      data.set("media_type", file.type || "application/octet-stream");
      data.delete("file");
      const authorization = await authorizeUpload(data);
      if (authorization.error || !authorization.path || !authorization.token)
        throw Error(authorization.error);
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        { auth: { persistSession: false } },
      );
      const { error } = await client.storage
        .from("operation-documents")
        .uploadToSignedUrl(authorization.path, authorization.token, file, {
          contentType: "application/octet-stream",
        });
      if (error)
        throw Error(
          "Não foi possível receber o arquivo. Use Reenviar arquivo para tentar novamente sem criar outro registro.",
        );
      setMessage("Arquivo recebido. O original foi preservado.");
      form.reset();
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o arquivo.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="document_id" value={existing?.id ?? ""} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`operation-${existing?.id ?? "new"}`}>
            Operação
          </FieldLabel>
          <select
            id={`operation-${existing?.id ?? "new"}`}
            name="operation_id"
            required
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            {operations
              .filter((op) => !existing || op.id === existing.operation_id)
              .map((op) => (
                <option key={op.id} value={op.id}>
                  {op.title}
                </option>
              ))}
          </select>
        </Field>
        {!existing && (
          <>
            <Field>
              <FieldLabel htmlFor="kind">Tipo de documento</FieldLabel>
              <select
                id="kind"
                name="kind"
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              >
                <option value="attachment">Anexo da oferta</option>
                <option value="sending_evidence">Comprovante de envio</option>
                <option value="response">Resposta recebida</option>
                <option value="other">Outro documento</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="recipient_id">
                Destinatário (opcional)
              </FieldLabel>
              <select
                key={operation}
                id="recipient_id"
                name="recipient_id"
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              >
                <option value="">Documento da operação</option>
                {recipients
                  .filter((r) => r.operation === operation)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </Field>
          </>
        )}
        <Field>
          <FieldLabel htmlFor={`file-${existing?.id ?? "new"}`}>
            {existing
              ? `Reenviar: ${existing.original_name}`
              : "Arquivo original"}
          </FieldLabel>
          <Input
            id={`file-${existing?.id ?? "new"}`}
            name="file"
            type="file"
            required
            disabled={busy}
          />
        </Field>
      </FieldGroup>
      <p className="text-xs text-muted-foreground">
        Até 25 MiB. Arquivo privado; o original não pode ser sobrescrito. O
        envio ocorre diretamente ao Supabase.
      </p>
      <Button type="submit" disabled={busy || !operation}>
        {busy
          ? "Enviando…"
          : existing
            ? "Reenviar arquivo"
            : "Guardar documento"}
      </Button>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
