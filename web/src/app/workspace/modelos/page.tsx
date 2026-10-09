import Link from "next/link";
import { DepartmentFilter } from "@/components/department-filter";
import { DepartmentField } from "@/components/department-field";
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
import { FieldGroup } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import { saveTemplate } from "../flows";
export default async function Templates({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string;
    setor?: string;
    editar?: string;
    erro?: string;
    sucesso?: string;
  }>;
}) {
  const p = await searchParams;
  const { client, org, canWrite, departments } = await workspaceContext(p.org);
  const templates =
    checked(
      await client
        .from("email_templates")
        .select("*")
        .eq("organization_id", org.id)
        .order("name"),
    ) ?? [];
  const versions =
    checked(
      await client
        .from("email_template_versions")
        .select("*")
        .eq("organization_id", org.id)
        .order("version", { ascending: false }),
    ) ?? [];
  const edit = templates.find((t) => t.id === p.editar);
  const latest = versions.find((v) => v.template_id === edit?.id);
  const shown = templates.filter(
    (t) =>
      !p.setor ||
      (p.setor === "geral" ? !t.department_id : t.department_id === p.setor),
  );
  return (
    <AppShell active="workspace">
      <WorkspaceNav org={org} active="/modelos" />
      <header>
        <h1 className="text-3xl font-semibold">Modelos de e-mail</h1>
        <p className="mt-2 text-muted-foreground">
          Um texto de partida para cada oferta, com a assinatura da sua equipe.
        </p>
      </header>
      <Feedback error={p.erro} success={p.sucesso} />
      <DepartmentFilter
        org={org.id}
        departments={departments}
        selected={p.setor}
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {shown.length ? (
            shown.map((t) => {
              const v = versions.find((v) => v.template_id === t.id);
              return (
                <Card key={t.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{t.name}</CardTitle>
                      <Badge variant="secondary">
                        Versão {v?.version ?? "—"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {v?.subject} ·{" "}
                      {departments.find((d) => d.id === t.department_id)
                        ?.name ?? "Sem setor definido"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <p className="whitespace-pre-wrap text-sm">{v?.body}</p>
                    {v?.signature && (
                      <p className="whitespace-pre-wrap border-t pt-4 text-sm text-muted-foreground">
                        {v.signature}
                      </p>
                    )}
                    <div className="flex gap-4">
                      {canWrite && (
                        <Link
                          href={`?org=${org.id}&editar=${t.id}`}
                          className="text-sm text-primary underline"
                        >
                          Criar nova versão
                        </Link>
                      )}
                      <Link
                        href={`/workspace/propostas?org=${org.id}&modelo=${v?.id}`}
                        className="text-sm text-primary underline"
                      >
                        Usar em uma oferta
                      </Link>
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        Histórico de versões
                      </summary>
                      <div className="mt-3 flex flex-col gap-3">
                        {versions
                          .filter((x) => x.template_id === t.id)
                          .map((x) => (
                            <div key={x.id} className="rounded-lg border p-3">
                              <p className="font-medium">
                                Versão {x.version} · {x.subject}
                              </p>
                              <p className="mt-2 whitespace-pre-wrap">
                                {x.body}
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                                {x.signature}
                              </p>
                            </div>
                          ))}
                      </div>
                    </details>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhum modelo nesta seleção</CardTitle>
                <CardDescription>
                  Salve o assunto, o corpo e a assinatura usados pela sua
                  equipe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cada alteração cria uma versão. Ofertas já preparadas
                  preservam o texto original.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        {canWrite && (
          <Card>
            <CardHeader>
              <CardTitle>{edit ? "Nova versão" : "Criar modelo"}</CardTitle>
              <CardDescription>
                Escreva em texto simples. A oferta permite revisar e adaptar o
                conteúdo antes de salvar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                key={edit?.id ?? "novo"}
                action={saveTemplate}
                className="flex flex-col gap-5"
              >
                <input type="hidden" name="org" value={org.id} />
                <input type="hidden" name="id" value={edit?.id ?? ""} />
                <FieldGroup>
                  <DepartmentField
                    departments={departments}
                    defaultValue={edit?.department_id}
                  />{" "}
                  <TextField
                    label="Nome do modelo"
                    name="name"
                    required
                    maxLength={120}
                    defaultValue={edit?.name}
                    placeholder="Oferta facultativa — patrimonial"
                  />
                  <TextField
                    label="Assunto"
                    name="subject"
                    required
                    maxLength={300}
                    defaultValue={latest?.subject}
                  />
                  <TextField
                    label="Corpo do e-mail"
                    name="body"
                    multiline
                    required
                    maxLength={20000}
                    defaultValue={latest?.body}
                  />
                  <TextField
                    label="Assinatura"
                    name="signature"
                    multiline
                    maxLength={5000}
                    defaultValue={latest?.signature}
                    placeholder="Nome, cargo e dados da corretora"
                  />
                </FieldGroup>
                <SubmitButton>Salvar versão</SubmitButton>
                {edit && (
                  <Link href={`?org=${org.id}`} className="text-sm underline">
                    Cancelar edição
                  </Link>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
