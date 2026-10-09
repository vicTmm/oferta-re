import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { WorkspaceNav, Feedback } from "@/components/workspace-ui";
import { ProposalDetail } from "@/components/proposal-detail";
import { ProposalForm } from "@/components/proposal-form";
import { OfferComposer } from "@/components/offer-composer";
import { workspaceContext, checked } from "@/lib/workspace";
import { type Proposal, isClosed } from "@/lib/proposals";
export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    org?: string;
    erro?: string;
    sucesso?: string;
    modelo?: string;
  }>;
}) {
  const { id } = await params;
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
  const proposal = proposals.find((op) => op.id === id);
  if (!proposal) notFound();
  const lines =
    checked(
      await client
        .from("business_lines")
        .select("id,name")
        .eq("organization_id", org.id)
        .order("name"),
    ) ?? [];
  const offers =
    checked(
      await client
        .from("offers")
        .select("id")
        .eq("organization_id", org.id)
        .eq("operation_id", id)
        .order("created_at"),
    ) ?? [];
  const versions = offers.length
    ? (checked(
        await client
          .from("offer_versions")
          .select("*")
          .eq("organization_id", org.id)
          .in(
            "offer_id",
            offers.map((o) => o.id),
          )
          .order("version", { ascending: false }),
      ) ?? [])
    : [];
  const recipients = versions.length
    ? (checked(
        await client
          .from("offer_recipients")
          .select("*")
          .eq("organization_id", org.id)
          .in(
            "offer_version_id",
            versions.map((v) => v.id),
          ),
      ) ?? [])
    : [];
  const responses = recipients.length
    ? (checked(
        await client
          .from("responses")
          .select("*")
          .eq("organization_id", org.id)
          .in(
            "recipient_id",
            recipients.map((r) => r.id),
          )
          .order("created_at", { ascending: false }),
      ) ?? [])
    : [];
  const events =
    checked(
      await client
        .from("proposal_events")
        .select("id,event_type,from_stage,to_stage,note,created_at")
        .eq("organization_id", org.id)
        .eq("operation_id", id)
        .order("created_at", { ascending: false }),
    ) ?? [];
  const contacts = canWrite
    ? (checked(
        await client
          .from("contacts")
          .select("id,name,email,reinsurer_key")
          .eq("organization_id", org.id)
          .order("name"),
      ) ?? [])
    : [];
  const catalog = canWrite
    ? (checked(
        await client
          .from("latest_public_reinsurers")
          .select("monitoring_key,record"),
      ) ?? [])
    : [];
  const names = new Map(catalog.map((c) => [c.monitoring_key, c.record.nome]));
  const templates = canWrite
    ? (checked(
        await client
          .from("email_templates")
          .select("id,name")
          .eq("organization_id", org.id),
      ) ?? [])
    : [];
  const templateVersions = templates.length
    ? (checked(
        await client
          .from("email_template_versions")
          .select("*")
          .eq("organization_id", org.id)
          .order("version", { ascending: false }),
      ) ?? [])
    : [];
  const latest = templates.flatMap((t) => {
    const v = templateVersions.find((v) => v.template_id === t.id);
    return v ? [{ ...v, label: t.name }] : [];
  });
  const currentOffer = offers[0]?.id;
  const currentVersion = versions.find((v) => v.offer_id === currentOffer);
  return (
    <AppShell active="proposals">
      <WorkspaceNav org={org} active="/propostas" canManage={canManage} />
      <Feedback error={p.erro} success={p.sucesso} />
      <ProposalDetail
        proposal={proposal}
        org={org.id}
        versions={versions}
        recipients={recipients}
        responses={responses}
        events={events}
        prior={proposals.find((op) => op.id === proposal.prior_operation_id)}
        department={
          departments.find((d) => d.id === proposal.department_id)?.name
        }
        line={lines.find((l) => l.id === proposal.business_line_id)?.name}
        canWrite={canWrite}
      />
      {canWrite && (
        <details className="rounded-xl border bg-card p-5">
          <summary className="cursor-pointer font-medium">
            Editar dados e acompanhamento
          </summary>
          <div className="mt-5">
            <ProposalForm
              org={org.id}
              departments={departments}
              lines={lines}
              previous={proposals}
              proposal={proposal}
            />
          </div>
        </details>
      )}
      {canWrite && !isClosed(proposal.stage) && (
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              {currentOffer
                ? "Preparar nova versão da oferta"
                : "Preparar oferta ao mercado"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentOffer
                ? "A nova versão preserva o texto, os destinatários e os comprovantes anteriores."
                : "Selecione o mercado e revise as condições antes do envio pelo Outlook."}
            </p>
          </div>
          <OfferComposer
            org={org.id}
            operation={proposal}
            offerId={currentOffer}
            draft={currentVersion}
            templates={latest}
            contacts={contacts.map((c) => ({
              ...c,
              company: names.get(c.reinsurer_key) ?? c.reinsurer_key,
            }))}
            initial={p.modelo}
          />
        </section>
      )}
    </AppShell>
  );
}
