import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProposalDetail } from "@/components/proposal-detail";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  demoProposalData,
  demoLines,
  portalDemoDepartments,
} from "@/lib/demo-proposals";
import { brazilToday } from "@/lib/proposals";
export default async function DemoProposal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposals = demoProposalData(brazilToday());
  const proposal = proposals.find((p) => p.id === id);
  if (!proposal) notFound();
  const hasOffer = ["negotiation", "market", "placed"].includes(proposal.stage);
  const date = new Date().toISOString();
  const versions = hasOffer
    ? [
        {
          id: "demo-version",
          offer_id: "demo-offer",
          version: 1,
          subject: `${proposal.reference} · Oferta de resseguro`,
          body: "Prezados,\n\nEncaminhamos os termos da oferta fictícia para análise. Ficamos à disposição para esclarecimentos.\n\nAtenciosamente,",
          signature: "Ana Costa\nCorretora Exemplo\nana@example.com",
          created_at: date,
        },
      ]
    : [];
  const recipients = hasOffer
    ? [
        {
          id: "demo-recipient-a",
          offer_version_id: "demo-version",
          destination_name: "Mercado Exemplo A",
          destination_email: "mercado-a@example.com",
          status: "sent_confirmed",
          sent_at: date,
        },
        {
          id: "demo-recipient-b",
          offer_version_id: "demo-version",
          destination_name: "Mercado Exemplo B",
          destination_email: "mercado-b@example.com",
          status: "sent_confirmed",
          sent_at: date,
        },
      ]
    : [];
  const responses =
    proposal.stage === "negotiation"
      ? [
          {
            id: "demo-response",
            recipient_id: "demo-recipient-a",
            classification: "information_request",
            note: "O mercado solicitou esclarecer os limites e a franquia.",
            document_id: "demo-document",
            responded_at: date,
          },
        ]
      : [];
  const events = [
    {
      id: "demo-event-2",
      event_type: hasOffer ? "stage_changed" : "created",
      from_stage: "review",
      to_stage: proposal.stage,
      note: proposal.next_action,
      created_at: date,
    },
    ...(responses.length
      ? [
          {
            id: "demo-event-3",
            event_type: "response_recorded",
            to_stage: proposal.stage,
            note: "Dúvida do Mercado Exemplo A registrada com comprovante fictício.",
            created_at: date,
          },
        ]
      : []),
  ];
  return (
    <AppShell active="proposals">
      <Alert>
        <AlertTitle>Processo demonstrativo</AlertTitle>
        <AlertDescription>
          Dados, envios e comprovantes são exemplos fictícios. Esta tela não
          grava dados e não envia e-mails.
        </AlertDescription>
      </Alert>
      <ProposalDetail
        proposal={proposal}
        org="demo"
        versions={versions}
        recipients={recipients}
        responses={responses}
        events={events}
        prior={proposals.find((p) => p.id === proposal.prior_operation_id)}
        department={
          portalDemoDepartments.find((d) => d.id === proposal.department_id)
            ?.name
        }
        line={demoLines.find((l) => l.id === proposal.business_line_id)?.name}
        demo
      />
    </AppShell>
  );
}
