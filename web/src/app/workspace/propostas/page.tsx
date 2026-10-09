import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { WorkspaceNav, Feedback } from "@/components/workspace-ui";
import { ProposalBoard } from "@/components/proposal-board";
import { ProposalForm } from "@/components/proposal-form";
import { workspaceContext, checked } from "@/lib/workspace";
import { brazilToday, type Proposal } from "@/lib/proposals";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
export default async function Proposals({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string;
    renovar?: string;
    erro?: string;
    sucesso?: string;
    modelo?: string;
  }>;
}) {
  const p = await searchParams;
  const { client, org, canWrite, canManage, departments } =
    await workspaceContext(p.org);
  const proposals = (checked(
    await client
      .from("operations")
      .select("*")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false }),
  ) ?? []) as Proposal[];
  const lines =
    checked(
      await client
        .from("business_lines")
        .select("id,name")
        .eq("organization_id", org.id)
        .order("name"),
    ) ?? [];
  const renewFrom = p.renovar
    ? proposals.find((op) => op.id === p.renovar)
    : undefined;
  return (
    <AppShell active="proposals">
      <WorkspaceNav org={org} active="/propostas" canManage={canManage} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Propostas e renovações</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Acompanhe novos negócios, renovações, ofertas ao mercado e respostas
            em um processo compartilhado.
          </p>
        </div>
        {canWrite && (
          <Link href="#nova-proposta" className={buttonVariants()}>
            Nova proposta
          </Link>
        )}
      </header>
      <Feedback error={p.erro} success={p.sucesso} />
      <ProposalBoard
        org={org.id}
        proposals={proposals}
        departments={departments}
        lines={lines}
        today={brazilToday()}
      />
      {canWrite && (
        <Card id="nova-proposta">
          <CardHeader>
            <CardTitle>
              {renewFrom ? "Iniciar renovação" : "Cadastrar proposta"}
            </CardTitle>
            <CardDescription>
              {renewFrom
                ? `Histórico anterior: ${renewFrom.reference}. Revise os dados do novo período.`
                : "Comece pelo negócio. Prepare as ofertas e selecione o mercado quando estiver pronto."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProposalForm
              key={renewFrom?.id ?? "new"}
              org={org.id}
              departments={departments}
              lines={lines}
              previous={proposals}
              renewFrom={renewFrom}
              initialTemplate={p.modelo}
            />
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
