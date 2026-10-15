import Link from "next/link";
import {
  type Proposal,
  proposalStages,
  businessKinds,
  isClosed,
  dateLabel,
} from "@/lib/proposals";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Field, FieldLabel } from "./ui/field";
import { SubmitButton } from "./submit-button";
import { confirmSending } from "@/app/workspace/flows";
export type PortalVersion = {
  id: string;
  offer_id: string;
  version: number;
  subject: string;
  body: string;
  signature: string;
  created_at: string;
};
export type PortalRecipient = {
  id: string;
  offer_version_id: string;
  destination_name: string;
  destination_email: string;
  status: string;
  sent_at?: string | null;
};
export type PortalResponse = {
  id: string;
  recipient_id: string;
  classification: string;
  note?: string | null;
  document_id?: string | null;
  responded_at?: string | null;
};
export type PortalEvent = {
  id: string;
  event_type: string;
  from_stage?: string | null;
  to_stage: string;
  note: string;
  created_at: string;
};
export const responseLabels: Record<string, string> = {
  information_request: "Dúvida / pedido de informações",
  declined: "Negativa",
  accepted_partial: "Aceite parcial",
  accepted_total: "Aceite total",
  other: "Outro retorno",
  unconfirmed: "A confirmar",
};
export function ProposalDetail({
  proposal,
  org,
  versions,
  recipients,
  responses,
  events,
  prior,
  department,
  line,
  canWrite = false,
  demo = false,
}: {
  proposal: Proposal;
  org: string;
  versions: PortalVersion[];
  recipients: PortalRecipient[];
  responses: PortalResponse[];
  events: PortalEvent[];
  prior?: Proposal;
  department?: string;
  line?: string;
  canWrite?: boolean;
  demo?: boolean;
}) {
  const href = (id: string) =>
    demo
      ? `/demonstracao/propostas/${id}`
      : `/workspace/propostas/${id}?org=${org}`;
  const sent = recipients.filter((r) => r.sent_at).length,
    responded = new Set(responses.map((r) => r.recipient_id)).size;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={
              demo
                ? "/demonstracao?tela=propostas"
                : `/workspace/propostas?org=${org}`
            }
            className="text-sm text-primary underline"
          >
            Voltar à carteira
          </Link>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {businessKinds[proposal.business_kind]}
            </Badge>
            <Badge
              variant={proposal.stage === "placed" ? "success" : "outline"}
            >
              {proposalStages[proposal.stage]}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{proposal.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {proposal.reference} · {proposal.cedent_name}
          </p>
        </div>
        {canWrite && (
          <Link
            href={`/workspace/propostas?org=${org}&renovar=${proposal.id}#nova-proposta`}
            className={buttonVariants({ variant: "outline" })}
          >
            Iniciar renovação
          </Link>
        )}
      </header>
      <div className="grid gap-y-5 border-y py-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Setor / linha",
            `${department ?? "Sem setor"} · ${line ?? "A definir"}`,
          ],
          [
            "Vigência",
            `${dateLabel(proposal.coverage_start)} → ${dateLabel(proposal.coverage_end)}`,
          ],
          ["Prazo da próxima ação", dateLabel(proposal.due_date)],
          [
            "Retornos por destinatário e versão",
            `${responded} de ${recipients.length} · ${sent} envios informados`,
          ],
        ].map(([label, value]) => (
          <div key={label} className="border-l-2 pl-4 first:border-primary">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>
      {prior && (
        <p className="text-sm text-muted-foreground">
          Histórico da renovação:{" "}
          <Link className="text-primary underline" href={href(prior.id)}>
            {prior.reference} · {prior.title}
          </Link>
          . As evidências anteriores permanecem no processo original.
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados e próxima ação</CardTitle>
            <CardDescription>Controle operacional da equipe</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>Segurado / risco: {proposal.insured_name || "Não informado"}</p>
            <p>Contrato: {proposal.contract_reference || "Não informado"}</p>
            <p className="whitespace-pre-wrap">
              {proposal.next_action ||
                "Defina o próximo passo no acompanhamento."}
            </p>
            {isClosed(proposal.stage) && (
              <p className="whitespace-pre-wrap border-t pt-3">
                Resultado registrado:{" "}
                {proposal.closure_note || "Sem detalhe no registro legado."}
              </p>
            )}
            <Link
              className="text-primary underline"
              href={
                demo
                  ? "/demonstracao?tela=comprovantes"
                  : `/workspace/comprovantes?org=${org}&operacao=${proposal.id}`
              }
            >
              Documentos, anexos e respostas
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Histórico do processo</CardTitle>
            <CardDescription>
              Criação, alterações de etapa e registros de resposta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex max-h-80 flex-col gap-4 overflow-auto">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="border-l-2 border-primary/20 pl-4"
                >
                  <p className="text-sm font-medium">
                    {event.event_type === "created"
                      ? "Proposta cadastrada"
                      : event.event_type === "offer_prepared"
                        ? "Oferta preparada para revisão"
                        : event.event_type === "send_recorded"
                          ? "Envio informado pela equipe"
                          : event.event_type === "response_recorded"
                            ? "Resposta registrada"
                            : event.event_type === "response_updated"
                              ? "Classificação de resposta atualizada"
                              : event.event_type === "stage_changed"
                                ? `${proposalStages[event.from_stage as keyof typeof proposalStages] ?? "Etapa anterior"} → ${proposalStages[event.to_stage as keyof typeof proposalStages]}`
                                : "Dados de acompanhamento atualizados"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}{" "}
                    · Brasília
                  </p>
                  {event.note && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {event.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            {!events.length && (
              <p className="text-sm text-muted-foreground">
                As próximas alterações aparecerão aqui. Registros anteriores à
                implantação podem não ter eventos nesta linha do tempo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Ofertas ao mercado e suas versões
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O texto preparado, o envio informado e o retorno do mercado são
            registros distintos.
          </p>
        </div>
        {!versions.length && (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhuma oferta preparada. Defina as condições e selecione os
            contatos na próxima etapa.
          </div>
        )}
        {versions.map((version) => (
          <Card key={version.id}>
            <CardHeader>
              <CardTitle>{version.subject}</CardTitle>
              <CardDescription>
                Versão {version.version} · texto e destinatários preservados
              </CardDescription>
            </CardHeader>
            <CardContent className="grid items-start gap-6 lg:grid-cols-2">
              <details className="rounded-xl border p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Ler o e-mail preparado
                </summary>
                <p className="mt-4 whitespace-pre-wrap text-sm">
                  {version.body}
                </p>
                <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm text-muted-foreground">
                  {version.signature}
                </p>
              </details>
              <div className="flex flex-col gap-3">
                {recipients
                  .filter((r) => r.offer_version_id === version.id)
                  .map((recipient) => {
                    const returns = responses.filter(
                      (r) => r.recipient_id === recipient.id,
                    );
                    return (
                      <div
                        key={recipient.id}
                        className="flex flex-col gap-3 rounded-xl border p-4"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="text-sm font-medium">
                            {recipient.destination_name}
                          </p>
                          <Badge
                            variant={returns.length ? "success" : "secondary"}
                          >
                            {returns.length
                              ? "Retorno registrado"
                              : recipient.sent_at
                                ? "Envio informado"
                                : "Preparado"}
                          </Badge>
                        </div>
                        <p className="break-all text-sm text-muted-foreground">
                          {recipient.destination_email}
                        </p>
                        {recipient.sent_at && (
                          <p className="text-xs text-muted-foreground">
                            Envio informado em{" "}
                            {new Date(recipient.sent_at).toLocaleString(
                              "pt-BR",
                              { timeZone: "America/Sao_Paulo" },
                            )}
                          </p>
                        )}
                        {returns.map((response) => (
                          <div
                            key={response.id}
                            className="border-t pt-3 text-sm"
                          >
                            <p>
                              {responseLabels[response.classification] ??
                                "A confirmar"}
                            </p>
                            {response.note && (
                              <p className="mt-1 text-muted-foreground">
                                {response.note}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {response.document_id
                                ? "Comprovante vinculado"
                                : "Comprovante pendente (registro anterior)"}
                              {response.responded_at
                                ? ` · ${new Date(response.responded_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
                                : ""}
                            </p>
                          </div>
                        ))}
                        {canWrite && !recipient.sent_at && (
                          <form
                            action={confirmSending}
                            className="flex flex-col gap-3"
                          >
                            <input type="hidden" name="org" value={org} />
                            <input
                              type="hidden"
                              name="operation_id"
                              value={proposal.id}
                            />
                            <input
                              type="hidden"
                              name="recipient_id"
                              value={recipient.id}
                            />
                            <Field orientation="horizontal">
                              <input
                                type="checkbox"
                                required
                                name="confirmed"
                                id={`sent-${recipient.id}`}
                              />
                              <FieldLabel htmlFor={`sent-${recipient.id}`}>
                                Conferi e enviei pelo Outlook
                              </FieldLabel>
                            </Field>
                            <SubmitButton>Registrar envio manual</SubmitButton>
                          </form>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <p className="text-xs text-muted-foreground">
        Integração de envio e rastreio Outlook em planejamento. Preparar uma
        oferta não envia e-mail. Registros manuais e etapas não substituem
        comprovantes nem certificam a colocação.
      </p>
    </>
  );
}
