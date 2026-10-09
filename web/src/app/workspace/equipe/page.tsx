import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { WorkspaceNav, Feedback, TextField } from "@/components/workspace-ui";
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
import { InvitationForm } from "@/components/invitation-form";
import {
  createDepartment,
  assignDepartment,
  revokeInvitation,
} from "./actions";
const roles: Record<string, string> = {
  owner: "Responsável",
  admin: "Administrador",
  member: "Colaborador",
  viewer: "Consulta",
};
export default async function Team({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; erro?: string; sucesso?: string }>;
}) {
  const p = await searchParams;
  const { client, org, role, canManage, departments } = await workspaceContext(
    p.org,
  );
  const businessLines =
    checked(
      await client
        .from("business_lines")
        .select("id,name")
        .eq("organization_id", org.id),
    ) ?? [];
  const lineLinks =
    checked(
      await client
        .from("department_business_lines")
        .select("department_id,business_line_id")
        .eq("organization_id", org.id),
    ) ?? [];
  const team = canManage
    ? (checked(await client.rpc("company_team", { p_org: org.id })) ?? [])
    : [];
  const invitations = canManage
    ? (checked(
        await client
          .from("organization_invitations")
          .select("id,email,role,expires_at,accepted_at,revoked_at")
          .eq("organization_id", org.id)
          .order("created_at", { ascending: false }),
      ) ?? [])
    : [];
  return (
    <AppShell active="workspace">
      <WorkspaceNav org={org} active="/equipe" canManage={canManage} />
      <header>
        <h1 className="text-3xl font-semibold">Setores e equipe</h1>
        <p className="mt-2 text-muted-foreground">
          Contas individuais, setores e dados compartilhados dentro de{" "}
          {org.name}.
        </p>
      </header>
      <Feedback error={p.erro} success={p.sucesso} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Setores da empresa</CardTitle>
              <CardDescription>
                Uma pessoa pode participar de vários setores. Contatos, modelos
                e ofertas permanecem compartilhados na empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {canManage && (
                <Link
                  className="text-sm text-primary underline"
                  href={`/workspace/ativacao?org=${org.id}`}
                >
                  Editar áreas e linhas de negócio
                </Link>
              )}
              {departments.length ? (
                departments.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-wrap justify-between gap-3 rounded-xl border p-4"
                  >
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lineLinks
                          .filter((l) => l.department_id === d.id)
                          .map(
                            (l) =>
                              businessLines.find(
                                (b) => b.id === l.business_line_id,
                              )?.name,
                          )
                          .filter(Boolean)
                          .join(" · ") || "Linhas de negócio a configurar"}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {
                        {
                          treaty: "Treaty",
                          facultative: "Facultativo",
                          other: "Outros",
                        }[d.area as "treaty"]
                      }
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cadastre setores como Treaty, Property e Financial Lines. Os
                  nomes são definidos pela sua empresa.
                </p>
              )}
            </CardContent>
          </Card>
          {canManage && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Pessoas com acesso</CardTitle>
                  <CardDescription>
                    O papel vale para a empresa; os setores organizam a atuação
                    de cada pessoa.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {team.map(
                    (m: {
                      user_id: string;
                      email: string;
                      role: string;
                      departments: string[];
                    }) => (
                      <div key={m.user_id} className="rounded-xl border p-4">
                        <div className="flex flex-wrap justify-between gap-3">
                          <p className="break-all font-medium">{m.email}</p>
                          <Badge variant="secondary">{roles[m.role]}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {m.departments.join(" · ") || "Sem setor definido"}
                        </p>
                      </div>
                    ),
                  )}
                  {departments.length > 0 && team.length > 0 && (
                    <form
                      action={assignDepartment}
                      className="flex flex-col gap-4 border-t pt-5"
                    >
                      <input type="hidden" name="org" value={org.id} />
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="user_id">Pessoa</FieldLabel>
                          <select
                            id="user_id"
                            name="user_id"
                            required
                            className="h-10 rounded-lg border bg-background px-3 text-sm"
                          >
                            {team.map(
                              (m: { user_id: string; email: string }) => (
                                <option key={m.user_id} value={m.user_id}>
                                  {m.email}
                                </option>
                              ),
                            )}
                          </select>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="department_id">
                            Adicionar ao setor
                          </FieldLabel>
                          <select
                            id="department_id"
                            name="department_id"
                            className="h-10 rounded-lg border bg-background px-3 text-sm"
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </FieldGroup>
                      <SubmitButton>Vincular pessoa ao setor</SubmitButton>
                    </form>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Convites</CardTitle>
                  <CardDescription>
                    Links válidos por 7 dias, vinculados ao e-mail convidado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {invitations.map((i) => {
                    const pending =
                      !i.accepted_at &&
                      !i.revoked_at &&
                      new Date(i.expires_at) > new Date();
                    return (
                      <div
                        key={i.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                      >
                        <div>
                          <p className="break-all text-sm font-medium">
                            {i.email}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {roles[i.role]} ·{" "}
                            {i.accepted_at
                              ? "Aceito"
                              : i.revoked_at
                                ? "Revogado"
                                : pending
                                  ? "Pendente"
                                  : "Expirado"}
                          </p>
                        </div>
                        {pending && (
                          <form action={revokeInvitation}>
                            <input type="hidden" name="org" value={org.id} />
                            <input type="hidden" name="id" value={i.id} />
                            <SubmitButton>Revogar convite</SubmitButton>
                          </form>
                        )}
                      </div>
                    );
                  })}
                  {!invitations.length && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum convite criado.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
        {canManage && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Novo setor</CardTitle>
                <CardDescription>
                  Separe os times conforme a organização da empresa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createDepartment} className="flex flex-col gap-5">
                  <input type="hidden" name="org" value={org.id} />
                  <FieldGroup>
                    <TextField
                      label="Nome do setor"
                      name="name"
                      required
                      maxLength={100}
                      placeholder="Property"
                    />
                    <Field>
                      <FieldLabel htmlFor="area">Área</FieldLabel>
                      <select
                        id="area"
                        name="area"
                        className="h-10 rounded-lg border bg-background px-3 text-sm"
                      >
                        <option value="facultative">Facultativo</option>
                        <option value="treaty">
                          Treaty · Soluções Estruturadas
                        </option>
                        <option value="other">Outra área</option>
                      </select>
                    </Field>
                  </FieldGroup>
                  <SubmitButton>Criar setor</SubmitButton>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Convidar colega</CardTitle>
                <CardDescription>
                  O colega entra com sua própria conta, sem compartilhar senhas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvitationForm
                  org={org.id}
                  departments={departments}
                  owner={role === "owner"}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
