"use client";
import { useState } from "react";
import { saveProposal } from "@/app/workspace/propostas/actions";
import {
  proposalStages,
  businessKinds,
  isClosed,
  type Proposal,
} from "@/lib/proposals";
import { Field, FieldLabel, FieldGroup } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { DepartmentField } from "./department-field";
import { HelpTooltip } from "./tooltip-hint";
import { SubmitButton } from "./submit-button";
const selectClass =
  "h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm";
export function ProposalForm({
  org,
  departments,
  lines,
  previous,
  proposal,
  renewFrom,
  initialTemplate,
  demo = false,
}: {
  org: string;
  departments: { id: string; name: string }[];
  lines: { id: string; name: string }[];
  previous: Proposal[];
  proposal?: Proposal;
  renewFrom?: Proposal;
  initialTemplate?: string;
  demo?: boolean;
}) {
  const defaults = proposal ?? renewFrom;
  const [kind, setKind] = useState(
    proposal?.business_kind ?? (renewFrom ? "renewal" : "new_business"),
  );
  const [stage, setStage] = useState(proposal?.stage ?? "preparation");
  const text = (
    key: string,
    label: string,
    value: string | null | undefined,
    max: number,
    required = false,
    type = "text",
  ) => (
    <Field>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Input
        id={key}
        name={key}
        defaultValue={value ?? ""}
        maxLength={max}
        type={type}
        required={required}
      />
    </Field>
  );
  return (
    <form
      action={demo ? undefined : saveProposal}
      onSubmit={demo ? (e) => e.preventDefault() : undefined}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="id" value={proposal?.id ?? ""} />
      {initialTemplate && (
        <input type="hidden" name="initial_template" value={initialTemplate} />
      )}
      <input
        type="hidden"
        name="revision"
        value={proposal?.proposal_revision ?? 0}
      />
      {!proposal && <input type="hidden" name="stage" value="preparation" />}
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="business_kind">Tipo de negócio</FieldLabel>
            <select
              id="business_kind"
              name="business_kind"
              className={selectClass}
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              {Object.entries(businessKinds).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          {text(
            "reference",
            "Referência interna *",
            proposal?.reference,
            120,
            true,
          )}
          {text(
            "title",
            "Título da proposta *",
            proposal?.title ??
              (renewFrom ? `Renovação · ${renewFrom.title}` : ""),
            200,
            true,
          )}
          {text("cedent_name", "Cedente *", defaults?.cedent_name, 200, true)}
          {text(
            "insured_name",
            "Segurado / risco (opcional)",
            defaults?.insured_name,
            200,
          )}
          {text(
            "contract_reference",
            "Referência do contrato (opcional)",
            defaults?.contract_reference,
            120,
          )}
          <DepartmentField
            departments={departments}
            defaultValue={defaults?.department_id}
          />
          <Field>
            <div className="flex items-center gap-1.5">
              <FieldLabel htmlFor="business_line_id">
                Linha de negócio
              </FieldLabel>
              <HelpTooltip
                label="Linha da proposta"
                content="Reutiliza as linhas cadastradas na configuração da empresa. Classifica a proposta sem criar restrições de acesso entre setores."
              />
            </div>
            <select
              className={selectClass}
              id="business_line_id"
              name="business_line_id"
              defaultValue={defaults?.business_line_id ?? ""}
            >
              <option value="">Configurar depois</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          {kind === "renewal" && (
            <Field className="sm:col-span-2">
              <div className="flex items-center gap-1.5">
                <FieldLabel htmlFor="prior_operation_id">
                  Proposta anterior (opcional)
                </FieldLabel>
                <HelpTooltip
                  label="Histórico da renovação"
                  content="A renovação cria um processo separado ligado à proposta anterior. Ofertas, datas e comprovantes anteriores permanecem preservados. Se o histórico começou fora do app, informe a referência do contrato."
                />
              </div>
              <select
                className={selectClass}
                id="prior_operation_id"
                name="prior_operation_id"
                defaultValue={
                  proposal?.prior_operation_id ?? renewFrom?.id ?? ""
                }
              >
                <option value="">
                  Histórico anterior fora do portal / não vinculado
                </option>
                {previous
                  .filter((p) => p.id !== proposal?.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference} · {p.title}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {text(
            "coverage_start",
            "Início da vigência",
            proposal?.coverage_start,
            10,
            false,
            "date",
          )}
          {text(
            "coverage_end",
            "Fim da vigência",
            proposal?.coverage_end,
            10,
            false,
            "date",
          )}
          {text(
            "due_date",
            "Prazo da próxima ação",
            proposal?.due_date,
            10,
            false,
            "date",
          )}
          {proposal && (
            <Field>
              <div className="flex items-center gap-1.5">
                <FieldLabel htmlFor="stage">Etapa do processo</FieldLabel>
                <HelpTooltip
                  label="Etapa do processo"
                  content="Controle operacional informado pela equipe. No mercado não comprova entrega, e Colocada exige revisão e confirmação do corretor; respostas isoladas não concluem o negócio."
                />
              </div>
              <select
                className={selectClass}
                id="stage"
                name="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as typeof stage)}
              >
                {Object.entries(proposalStages)
                  .filter(
                    ([key]) => key !== "closed" || proposal.stage === "closed",
                  )
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </Field>
          )}
        </div>
        <Field>
          <FieldLabel htmlFor="next_action">
            Próxima ação / pendência
          </FieldLabel>
          <Textarea
            id="next_action"
            name="next_action"
            rows={3}
            maxLength={1000}
            defaultValue={proposal?.next_action ?? ""}
            placeholder="Ex.: revisar termos e solicitar retorno do mercado"
          />
        </Field>
        {proposal && isClosed(stage) && (
          <Field>
            <FieldLabel htmlFor="closure_note">
              Resultado e motivo do encerramento *
            </FieldLabel>
            <Textarea
              id="closure_note"
              name="closure_note"
              required
              minLength={2}
              maxLength={2000}
              rows={3}
              defaultValue={proposal.closure_note}
              placeholder="Registre a decisão, suas condições e a referência da evidência."
            />
          </Field>
        )}
        <p className="text-xs text-muted-foreground">
          {renewFrom
            ? "Revise as novas condições e informe a vigência e o prazo desta renovação. Nenhum envio ou aceite anterior é transferido."
            : "Você pode cadastrar a proposta antes de preparar e-mails ou selecionar contatos."}{" "}
          Prazos são controles visuais; não há lembretes automáticos ativos.
        </p>
      </FieldGroup>
      <SubmitButton disabled={demo}>
        {proposal
          ? "Salvar acompanhamento"
          : kind === "renewal"
            ? "Criar renovação"
            : "Criar proposta"}
      </SubmitButton>
    </form>
  );
}
