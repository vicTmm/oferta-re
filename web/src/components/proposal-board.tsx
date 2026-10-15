"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ArrowRight,
  List,
  Columns3,
  RefreshCw,
  Search,
  X,
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
import { normalize } from "@/lib/catalog-utils";
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
      normalize(
        `${p.reference} ${p.title} ${p.cedent_name} ${p.insured_name ?? ""} ${p.contract_reference ?? ""}`,
      ).includes(normalize(query.trim())),
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
      "Renovações nos próximos 30 dias",
      proposals.filter((p) => upcomingRenewal(p, today)).length,
    ],
  ];
  metrics.push([
    "Vigências a vencer em 30 dias",
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
      <div className="grid grid-cols-2 gap-y-5 border-y py-5 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="border-l-2 border-border pl-4 first:border-primary"
          >
            <p className="min-h-8 text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
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
      <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(260px,2fr)_1fr_1fr_1fr]">
        <Field>
          <FieldLabel htmlFor="proposal-search">Buscar proposta</FieldLabel>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="proposal-search"
              type="search"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Título, referência ou cedente"
            />
          </div>
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
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {shown.length} de {proposals.length} propostas
        </p>
        {(query || kind || stage || sector) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setKind("");
              setStage("");
              setSector("");
            }}
          >
            <X className="size-3.5" />
            Limpar filtros
          </Button>
        )}
      </div>
      {view === "list" ? (
        <div className="overflow-hidden border-y">
          <div
            className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_110px_24px] gap-5 border-b px-3 py-3 text-xs font-medium text-muted-foreground lg:grid"
            aria-hidden="true"
          >
            <span>Proposta / cedente</span>
            <span>Setor / tipo</span>
            <span>Etapa</span>
            <span>Prazo</span>
            <span />
          </div>
          <div className="divide-y">
            {shown.map((p) => (
              <Link
                key={p.id}
                href={
                  demo
                    ? `/demonstracao/propostas/${p.id}`
                    : `/workspace/propostas/${p.id}?org=${org}`
                }
                className="group grid gap-3 px-3 py-5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:grid-cols-[minmax(0,2fr)_1fr_1fr_110px_24px] lg:items-center lg:gap-5"
              >
                <div className="min-w-0">
                  <p className="font-medium group-hover:text-primary">
                    {p.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.reference} · {p.cedent_name}
                  </p>
                  {p.next_action && (
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                      {p.next_action}
                    </p>
                  )}
                </div>
                <div className="text-sm">
                  <p>
                    {departments.find((d) => d.id === p.department_id)?.name ??
                      "Sem setor"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {businessKinds[p.business_kind]}
                  </p>
                </div>
                <div>
                  <Badge
                    variant={p.stage === "placed" ? "success" : "secondary"}
                  >
                    {proposalStages[p.stage]}
                  </Badge>
                </div>
                <div
                  className={
                    isOverdue(p, today)
                      ? "text-sm text-destructive"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {p.due_date ? dateLabel(p.due_date) : "Sem prazo"}
                  {isOverdue(p, today) && (
                    <p className="mt-1 text-xs">Vencido</p>
                  )}
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="hidden size-4 text-muted-foreground group-hover:text-primary lg:block"
                />
              </Link>
            ))}
          </div>
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
