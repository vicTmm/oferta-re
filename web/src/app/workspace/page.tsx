import Link from "next/link";
import { WelcomePanel } from "@/components/mascot";
import { CompanyPortfolio } from "@/components/company-portfolio";
import { CompanySetupCard } from "@/components/company-setup-card";
import { WorkspaceNav } from "@/components/workspace-ui";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { serverSupabase } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { createOrganization } from "./actions";
import { signOut } from "../entrar/actions";
export const dynamic = "force-dynamic";
export default async function Workspace({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; org?: string }>;
}) {
  const client = await serverSupabase();
  if (!client) redirect("/entrar");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: organizations, error } = await client
    .from("organizations")
    .select("id,name")
    .order("created_at");
  const params = await searchParams;
  return (
    <AppShell active="workspace">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Ambiente da empresa</h1>
        <div className="flex items-center gap-3">
          <Link href="/convite" className="text-sm text-primary underline">
            Tenho um convite
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sair
            </Button>
          </form>
        </div>
      </div>
      {(error || params.erro) && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível concluir a solicitação</AlertTitle>
          <AlertDescription>
            Tente novamente. Se persistir, contate o responsável pela sua conta.
          </AlertDescription>
        </Alert>
      )}
      {!error && !organizations?.length ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Organize o espaço da sua equipe</CardTitle>
            <CardDescription>
              Crie o ambiente da empresa para começar. Os registros são privados
              para os membros da organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOrganization} className="flex flex-col gap-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Nome da empresa</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </Field>
              </FieldGroup>
              <Button type="submit">Criar ambiente da empresa</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        (params.org
          ? organizations?.filter((o) => o.id === params.org)
          : organizations
        )?.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription>Seu espaço de trabalho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <WorkspaceNav org={org} active="" />
                <CompanySetupCard org={org} />
                <WelcomePanel
                  title="Acompanhe cada proposta até o próximo passo"
                  description="Cadastre novos negócios e renovações, acompanhe prazos, prepare ofertas e reúna as respostas do mercado."
                />
                <CompanyPortfolio org={org} />
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    [
                      "equipe",
                      "Setores e equipe",
                      "Organize os times e convide colegas para o ambiente.",
                    ],
                    [
                      "contatos",
                      "Organize sua base",
                      "Cadastre os canais de subscrição por resseguradora.",
                    ],
                    [
                      "modelos",
                      "Prepare seus modelos",
                      "Salve assunto, texto e assinatura com histórico.",
                    ],
                    [
                      "propostas",
                      "Propostas e renovações",
                      "Organize a carteira, os prazos e as ofertas de cada negócio.",
                    ],
                    [
                      "comprovantes",
                      "Guarde as evidências",
                      "Vincule anexos e respostas a cada operação.",
                    ],
                  ].map(([path, title, description]) => (
                    <Link
                      key={path}
                      href={`/workspace/${path}?org=${org.id}`}
                      className="rounded-xl border p-5 transition-colors hover:bg-accent"
                    >
                      <p className="font-medium text-primary">{title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </AppShell>
  );
}
