"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ArrowRight,
  List,
  Columns3,
  RefreshCw,
} from "lucide-react";
import {
  type Proposal,
  proposalStages,
  businessKinds,
  isClosed,
  isOverdue,
  upcomingRenewal,
  expiringCoverage,
  dateLabel,
} from "@/lib/proposals";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Field, FieldLabel } from "./ui/field";
import { HelpTooltip } from "./tooltip-hint";
export function ProposalBoard({
  proposals,
  org,
  departments = [],
  lines = [],
  demo = false,
  today,
}: {
  proposals: Proposal[];
  org: string;
  departments?: { id: string; name: string }[];
  lines?: { id: string; name: string }[];
  demo?: boolean;
  today: string;
}) {
  const [view, setView] = useState("list"),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState(""),
    [stage, setStage] = useState(""),
    [sector, setSector] = useState("");
  const shown = proposals.filter(
    (p) =>
      (!kind || p.business_kind === kind) &&
      (!stage || p.stage === stage) &&
      (!sector ||
        (sector === "general"
          ? !p.department_id
          : p.department_id === sector)) &&
      `${p.reference} ${p.title} ${p.cedent_name} ${p.insured_name ?? ""} ${p.contract_reference ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const metrics = [
    ["Propostas ativas", proposals.filter((p) => !isClosed(p.stage)).length],
    [
      "Renovações ativas",
      proposals.filter(
        (p) => p.business_kind === "renewal" && !isClosed(p.stage),
      ).length,
    ],
    ["Prazos vencidos", proposals.filter((p) => isOverdue(p, today)).length],
    [
      "Renovações com prazo · 30 dias",
      proposals.filter((p) => upcomingRenewal(p, today)).length,
    ],
  ];
  metrics.push([
    "Vigências a vencer · 30 dias",
    proposals.filter((p) => expiringCoverage(p, today)).length,
  ]);
  const card = (p: Proposal) => (
    <Link
      href={
        demo
          ? `/demonstracao/propostas/${p.id}`
          : `/workspace/propostas/${p.id}?org=${org}`
      }
      className="flex h-full min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary">{businessKinds[p.business_kind]}</Badge>
        <Badge variant={p.stage === "placed" ? "success" : "outline"}>
          {proposalStages[p.stage]}
        </Badge>
        {isOverdue(p, today) && (
          <Badge variant="destructive">Prazo vencido</Badge>
        )}
      </div>
      <div>
        <p className="break-words font-medium text-primary">{p.title}</p>
        <p className="mt-1 break-words text-sm text-muted-foreground">
          {p.reference} · {p.cedent_name}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        {departments.find((d) => d.id === p.department_id)?.name ?? "Sem setor"}{" "}
        ·{" "}
        {lines.find((l) => l.id === p.business_line_id)?.name ??
          "Linha a definir"}
      </p>
      {p.next_action && (
        <p className="line-clamp-2 break-words text-sm">{p.next_action}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5" />
          Prazo: {dateLabel(p.due_date)}
        </span>
        <ArrowRight className="size-4 text-primary" />
      </div>
    </Link>
  );
  const selectClass =
    "h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm";
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <p className="min-h-8 text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Carteira de propostas</h2>
          <HelpTooltip
            label="Prazos e etapas da carteira"
            content="Os indicadores consideram toda a carteira. Vigências a vencer considera registros marcados Colocada com fim da vigência nos próximos 30 dias. Os filtros afetam a lista e o pipeline. Prazos usam a data de Brasília; etapa e resultado são registros operacionais da equipe."
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={view === "list" ? "default" : "outline"}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List />
            Lista
          </Button>
          <Button
            type="button"
            variant={view === "pipeline" ? "default" : "outline"}
            aria-pressed={view === "pipeline"}
            onClick={() => setView("pipeline")}
          >
            <Columns3 />
            Pipeline
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field>
          <FieldLabel htmlFor="proposal-search">Buscar proposta</FieldLabel>
          <Input
            id="proposal-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Título, referência ou cedente"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="proposal-kind">Tipo de negócio</FieldLabel>
          <select
            id="proposal-kind"
            className={selectClass}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(businessKinds).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="proposal-stage">Etapa</FieldLabel>
          <select
            id="proposal-stage"
            className={selectClass}
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(proposalStages).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="proposal-sector">Setor</FieldLabel>
          <select
            id="proposal-sector"
            className={selectClass}
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="general">Sem setor</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {shown.length} de {proposals.length} propostas · informações
        compartilhadas na empresa
      </p>
      {view === "list" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <div key={p.id}>{card(p)}</div>
          ))}
        </div>
      ) : (
        <div
          className="min-w-0 overflow-x-auto rounded-xl border bg-muted/30 p-3"
          tabIndex={0}
          aria-label="Pipeline de propostas; role horizontalmente para ver todas as etapas"
        >
          <div className="flex w-max gap-4">
            {Object.entries(proposalStages)
              .filter(
                ([s]) =>
                  s !== "closed" || shown.some((p) => p.stage === "closed"),
              )
              .map(([s, label]) => (
                <section key={s} className="flex w-64 flex-col gap-3">
                  <div className="flex justify-between px-1 py-2 text-sm font-medium">
                    <span>{label}</span>
                    <Badge variant="secondary">
                      {shown.filter((p) => p.stage === s).length}
                    </Badge>
                  </div>
                  {shown
                    .filter((p) => p.stage === s)
                    .map((p) => (
                      <div key={p.id}>{card(p)}</div>
                    ))}
                </section>
              ))}
          </div>
        </div>
      )}
      {!shown.length && (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <RefreshCw className="mx-auto size-6 text-primary" />
          <p className="mt-3 font-medium">Nenhuma proposta nesta seleção</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            Ajuste os filtros ou cadastre um novo negócio ou renovação.
          </p>
        </div>
      )}
    </section>
  );
}
