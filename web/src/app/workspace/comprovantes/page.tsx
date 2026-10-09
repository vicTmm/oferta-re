import { AppShell } from "@/components/app-shell";
import { WorkspaceNav, TextField, Feedback } from "@/components/workspace-ui";
import { workspaceContext, checked } from "@/lib/workspace";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import { DocumentUpload } from "@/components/document-upload";
import { recordResponse } from "../flows";
export default async function Evidence({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string;
    operacao?: string;
    erro?: string;
    sucesso?: string;
  }>;
}) {
  const p = await searchParams;
  const { client, org, canWrite } = await workspaceContext(p.org);
  const operations =
    checked(
      await client
        .from("operations")
        .select("id,title,reference")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false }),
    ) ?? [];
  const docs =
    checked(
      await client
        .from("documents")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false }),
    ) ?? [];
  const responses =
    checked(
      await client
        .from("responses")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false }),
    ) ?? [];
  const offers =
    checked(
      await client
        .from("offers")
        .select("id,operation_id")
        .eq("organization_id", org.id),
    ) ?? [];
  const versions =
    checked(
      await client
        .from("offer_versions")
        .select("id,offer_id")
        .eq("organization_id", org.id),
    ) ?? [];
  const raw =
    checked(
      await client
        .from("offer_recipients")
        .select("id,destination_name,destination_email,offer_version_id")
        .eq("organization_id", org.id),
    ) ?? [];
  const recipients = raw.map((r) => ({
    ...r,
    name: `${r.destination_name} · ${r.destination_email}`,
    operation:
      offers.find(
        (o) =>
          o.id === versions.find((v) => v.id === r.offer_version_id)?.offer_id,
      )?.operation_id ?? "",
  }));
  const filtered = docs.filter(
    (d) => !p.operacao || d.operation_id === p.operacao,
  );
  const kinds: Record<string, string> = {
    attachment: "Anexo",
    sending_evidence: "Comprovante de envio",
    response: "Resposta",
    other: "Outro",
  };
  const classifications: Record<string, string> = {
    information_request: "Pedido de informação",
    declined: "Recusa",
    accepted_partial: "Aceite parcial",
    accepted_total: "Aceite integral",
    other: "Outra resposta",
    unconfirmed: "Não confirmado",
  };
  return (
    <AppShell active="workspace">
      <WorkspaceNav org={org} active="/comprovantes" />
      <header>
        <h1 className="text-3xl font-semibold">Comprovantes e respostas</h1>
        <p className="mt-2 text-muted-foreground">
          Guarde os originais e recupere o histórico de cada operação.
        </p>
      </header>
      <Feedback error={p.erro} success={p.sucesso} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos da corretora</CardTitle>
              <CardDescription>
                {filtered.length} documentos · arquivos privados
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <form className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="org" value={org.id} />
                <Field>
                  <FieldLabel htmlFor="filter-operation">
                    Filtrar operação
                  </FieldLabel>
                  <select
                    id="filter-operation"
                    name="operacao"
                    defaultValue={p.operacao ?? ""}
                    className="h-10 rounded-lg border bg-background px-3 text-sm"
                  >
                    <option value="">Todas as operações</option>
                    {operations.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.reference} · {op.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <SubmitButton>Filtrar</SubmitButton>
              </form>
              {filtered.length ? (
                filtered.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col gap-3 rounded-xl border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="break-all font-medium">{d.original_name}</p>
                      <Badge variant="secondary">{kinds[d.kind]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {operations.find((op) => op.id === d.operation_id)?.title}{" "}
                      · {(d.size_bytes / 1024).toFixed(1)} KiB
                      {d.recipient_id
                        ? ` · ${recipients.find((r) => r.id === d.recipient_id)?.name ?? ""}`
                        : ""}
                    </p>
                    <a
                      href={`/workspace/arquivos/${d.id}?org=${org.id}`}
                      className="text-sm text-primary underline"
                    >
                      Baixar original
                    </a>
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">
                        Identificação do arquivo
                      </summary>
                      <p className="mt-2 break-all">SHA-256: {d.sha256}</p>
                    </details>
                    {canWrite && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-primary">
                          Reenviar arquivo se o upload falhou
                        </summary>
                        <div className="mt-4">
                          <DocumentUpload
                            org={org.id}
                            operations={operations}
                            recipients={recipients}
                            existing={d}
                          />
                        </div>
                      </details>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <p className="font-medium">Nenhum documento nesta seleção</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Envie anexos, respostas ou comprovantes usando o formulário.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de respostas</CardTitle>
              <CardDescription>
                Classificações informadas pela equipe, com vínculo ao
                comprovante quando disponível.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {responses
                .filter(
                  (r) =>
                    !p.operacao ||
                    recipients.find((x) => x.id === r.recipient_id)
                      ?.operation === p.operacao,
                )
                .map((r) => (
                  <div key={r.id} className="rounded-xl border p-4">
                    <p className="font-medium">
                      {classifications[r.classification]}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {recipients.find((x) => x.id === r.recipient_id)?.name}
                    </p>
                    {r.note && (
                      <p className="mt-3 whitespace-pre-wrap text-sm">
                        {r.note}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {r.document_id
                        ? "Com documento vinculado"
                        : "Sem comprovante vinculado"}
                    </p>
                  </div>
                ))}
              {!responses.length && (
                <p className="text-sm text-muted-foreground">
                  As respostas registradas aparecerão aqui.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        {canWrite && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Guardar documento</CardTitle>
                <CardDescription>
                  Escolha a operação e, quando necessário, o destinatário.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operations.length ? (
                  <DocumentUpload
                    org={org.id}
                    operations={operations}
                    recipients={recipients}
                    initial={p.operacao}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Prepare uma oferta antes de guardar documentos.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Registrar resposta</CardTitle>
                <CardDescription>
                  O registro preserva a classificação e a observação da equipe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={recordResponse} className="flex flex-col gap-5">
                  <input type="hidden" name="org" value={org.id} />
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="response-recipient">
                        Destinatário
                      </FieldLabel>
                      <select
                        id="response-recipient"
                        name="recipient_id"
                        required
                        className="h-10 rounded-lg border bg-background px-3 text-sm"
                      >
                        <option value="">Selecione o contato</option>
                        {recipients
                          .filter(
                            (r) => !p.operacao || r.operation === p.operacao,
                          )
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="classification">
                        Classificação
                      </FieldLabel>
                      <select
                        id="classification"
                        name="classification"
                        className="h-10 rounded-lg border bg-background px-3 text-sm"
                      >
                        {Object.entries(classifications).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="response-document">
                        Comprovante da resposta *
                      </FieldLabel>
                      <select
                        id="response-document"
                        name="document_id"
                        required
                        className="h-10 rounded-lg border bg-background px-3 text-sm"
                      >
                        <option value="">
                          Selecione um arquivo com upload concluído
                        </option>
                        {docs
                          .filter(
                            (d) => d.kind === "response" && d.recipient_id,
                          )
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.original_name} ·{" "}
                              {
                                recipients.find((r) => r.id === d.recipient_id)
                                  ?.destination_name
                              }
                            </option>
                          ))}
                      </select>
                    </Field>
                    <TextField
                      label="Recebida em (Brasília, opcional)"
                      name="received_at"
                      type="datetime-local"
                    />
                    <TextField
                      label="Observação"
                      name="note"
                      multiline
                      maxLength={2000}
                    />
                  </FieldGroup>
                  <SubmitButton>Registrar resposta</SubmitButton>
                  <p className="text-xs text-muted-foreground">
                    O documento deve pertencer ao destinatário escolhido. A
                    classificação é um registro operacional da equipe.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
