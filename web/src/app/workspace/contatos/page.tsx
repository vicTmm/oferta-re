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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";
import { DepartmentFilter } from "@/components/department-filter";
import { DepartmentField } from "@/components/department-field";
import { saveContact } from "../flows";
export default async function Contacts({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string;
    setor?: string;
    q?: string;
    editar?: string;
    erro?: string;
    sucesso?: string;
  }>;
}) {
  const p = await searchParams;
  const { client, org, canWrite, departments } = await workspaceContext(p.org);
  const contacts =
    checked(
      await client
        .from("contacts")
        .select("*")
        .eq("organization_id", org.id)
        .order("name"),
    ) ?? [];
  const catalog =
    checked(
      await client
        .from("latest_public_reinsurers")
        .select("monitoring_key,record"),
    ) ?? [];
  const names = new Map(catalog.map((c) => [c.monitoring_key, c.record.nome]));
  const edit = contacts.find((c) => c.id === p.editar);
  const filtered = contacts
    .filter(
      (c) =>
        !p.setor ||
        (p.setor === "geral" ? !c.department_id : c.department_id === p.setor),
    )
    .filter((c) =>
      `${c.name} ${c.email} ${names.get(c.reinsurer_key) ?? ""} ${c.specialties.join(" ")}`
        .toLocaleLowerCase("pt-BR")
        .includes((p.q ?? "").toLocaleLowerCase("pt-BR")),
    );
  return (
    <AppShell active="workspace">
      <WorkspaceNav org={org} active="/contatos" />
      <header>
        <h1 className="text-3xl font-semibold">Contatos</h1>
        <p className="mt-2 text-muted-foreground">
          Sua base de subscrição, organizada por empresa e especialidade.
        </p>
      </header>
      <Feedback error={p.erro} success={p.sucesso} />
      <DepartmentFilter
        org={org.id}
        departments={departments}
        selected={p.setor}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Base da corretora</CardTitle>
            <CardDescription>
              {contacts.length} contatos cadastrados. Use apenas dados
              autorizados pela sua corretora.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <a
              className="text-sm text-primary underline"
              href={`/workspace/contatos/exportar?org=${org.id}`}
            >
              Exportar minha base em CSV
            </a>
            <form className="flex items-end gap-3">
              <input type="hidden" name="org" value={org.id} />
              <TextField
                label="Buscar contato"
                name="q"
                defaultValue={p.q}
                placeholder="Nome, e-mail ou empresa"
              />
              <SubmitButton>Buscar</SubmitButton>
            </form>
            {filtered.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Especialidades</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-muted-foreground">{c.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {departments.find((d) => d.id === c.department_id)
                            ?.name ?? "Sem setor definido"}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-52 whitespace-normal">
                        {names.get(c.reinsurer_key) ?? c.reinsurer_key}
                      </TableCell>
                      <TableCell>{c.specialties.join(", ") || "—"}</TableCell>
                      <TableCell>
                        {canWrite && (
                          <Link
                            className="text-primary underline"
                            href={`?org=${org.id}&editar=${c.id}`}
                          >
                            Editar
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="font-medium">
                  {contacts.length
                    ? "Nenhum contato encontrado"
                    : "Sua base começa aqui"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {contacts.length
                    ? "Tente outra busca."
                    : "Cadastre o primeiro contato no formulário ao lado."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        {canWrite && (
          <Card>
            <CardHeader>
              <CardTitle>{edit ? "Editar contato" : "Novo contato"}</CardTitle>
              <CardDescription>
                Os e-mails da SUSEP não são importados automaticamente como
                canais de subscrição.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                key={edit?.id ?? "novo"}
                action={saveContact}
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
                    label="Nome"
                    name="name"
                    required
                    maxLength={120}
                    defaultValue={edit?.name}
                  />
                  <TextField
                    label="E-mail profissional"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    defaultValue={edit?.email}
                  />
                  <Field>
                    <FieldLabel htmlFor="reinsurer_key">
                      Resseguradora
                    </FieldLabel>
                    <select
                      id="reinsurer_key"
                      name="reinsurer_key"
                      required
                      defaultValue={edit?.reinsurer_key ?? ""}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="">Selecione uma empresa</option>
                      {catalog.map((c) => (
                        <option key={c.monitoring_key} value={c.monitoring_key}>
                          {c.record.nome}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <TextField
                    label="Especialidades"
                    name="specialties"
                    placeholder="Patrimonial, rural, transportes"
                    maxLength={500}
                    defaultValue={edit?.specialties.join(", ")}
                  />
                  <TextField
                    label="Origem do contato"
                    name="source_note"
                    placeholder="Portal da empresa, base autorizada…"
                    maxLength={1000}
                    defaultValue={edit?.source_note ?? ""}
                  />
                </FieldGroup>
                <SubmitButton>
                  {edit ? "Salvar alterações" : "Cadastrar contato"}
                </SubmitButton>
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
