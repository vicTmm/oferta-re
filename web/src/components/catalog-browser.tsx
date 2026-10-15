"use client";
import { TooltipHint } from "./tooltip-hint";
import { useState } from "react";
import { Download, CircleAlert, ChevronLeft, ChevronRight } from "lucide-react";
import type { Catalog } from "@/lib/catalog";
import {
  businessDaysOld,
  catalogCsv,
  filterCatalog,
} from "@/lib/catalog-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

const categories = [
  "Todas",
  "Resseguradora Local",
  "Resseguradora Admitida",
  "Resseguradora Eventual",
];
const categoryLabel = (value: string) => value.replace("Resseguradora ", "");
export function CatalogBrowser({ catalog }: { catalog: Catalog }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [page, setPage] = useState(0);
  const records = filterCatalog(catalog.records, query, category);
  const pageSize = 20;
  const maxPage = Math.max(0, Math.ceil(records.length / pageSize) - 1);
  const visible = records.slice(page * pageSize, (page + 1) * pageSize);
  const collected = catalog.collectedAt
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(catalog.collectedAt))
    : null;
  const age = businessDaysOld(catalog.collectedAt);
  function download() {
    const url = URL.createObjectURL(
      new Blob([catalogCsv(records)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "oferta-re-resseguradoras.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const metrics = [
    {
      label: "Resseguradoras na base",
      value: catalog.records.length,
    },
    {
      label: "Locais",
      value: catalog.records.filter((r) => r.tipo === categories[1]).length,
    },
    {
      label: "Admitidas",
      value: catalog.records.filter((r) => r.tipo === categories[2]).length,
    },
    {
      label: "Eventuais",
      value: catalog.records.filter((r) => r.tipo === categories[3]).length,
    },
  ];
  return (
    <>
      <section className="brand-welcome flex flex-wrap items-center justify-between gap-5 rounded-2xl border p-5 sm:p-7">
        <div className="flex flex-col items-start gap-3">
          <Badge variant="secondary">CONSULTA PÚBLICA</Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Resseguradoras
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Encontre empresas cadastradas na SUSEP e organize o ponto de partida
            das suas ofertas.
          </p>
          <TooltipHint content="Baixa em CSV as empresas da consulta com os filtros atuais. E-mails cadastrais não são contatos de subscrição verificados.">
            <Button
              className="mt-1"
              onClick={download}
              disabled={!records.length}
            >
              <Download data-icon="inline-start" /> Exportar CSV
            </Button>
          </TooltipHint>
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-success" />
          {collected
            ? `Coleta de ${collected} · Brasília`
            : "Sem coleta validada disponível"}
        </span>
        <span>Fonte: SUSEP</span>
        {catalog.mode === "local" && (
          <Badge variant="outline">Base pública local</Badge>
        )}
      </div>
      {(catalog.unavailable || catalog.failed || (age !== null && age > 1)) && (
        <Alert>
          <CircleAlert />
          <AlertTitle>
            {catalog.unavailable
              ? "Base temporariamente indisponível"
              : catalog.failed
                ? "A última coleta falhou"
                : "Confira a atualização dos dados"}
          </AlertTitle>
          <AlertDescription>
            {catalog.unavailable
              ? "Não foi possível consultar a base. Tente novamente mais tarde."
              : catalog.failed
                ? "Os resultados abaixo são da última coleta validada."
                : "A coleta tem mais de um dia útil de defasagem. Confirme informações recentes na fonte oficial."}
          </AlertDescription>
        </Alert>
      )}
      <section
        className="grid grid-cols-2 gap-y-5 border-y py-5 lg:grid-cols-4"
        aria-label="Resumo da base"
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="border-l-2 pl-4 first:border-primary"
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {metric.value}
            </p>
          </div>
        ))}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Diretório de resseguradoras</CardTitle>
          <CardDescription>
            Busque por nome ou CNPJ e filtre pela categoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FieldGroup className="grid gap-4 md:grid-cols-[1fr_240px]">
            <Field>
              <FieldLabel htmlFor="search">Nome ou CNPJ</FieldLabel>
              <Input
                id="search"
                placeholder="Ex.: Swiss Re ou 00.000.000/0001-00"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(0);
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="category">Categoria</FieldLabel>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value ?? "Todas");
                  setPage(0);
                }}
              >
                <SelectTrigger id="category" className="h-10 w-full">
                  <SelectValue>
                    {category === "Todas"
                      ? "Todas as categorias"
                      : categoryLabel(category)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value === "Todas"
                          ? "Todas as categorias"
                          : categoryLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {records.length} de {catalog.records.length} registros
          </p>
          {records.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nenhuma resseguradora encontrada</EmptyTitle>
                <EmptyDescription>
                  {catalog.unavailable
                    ? "A base está indisponível no momento."
                    : "Tente outro nome, CNPJ ou categoria."}
                </EmptyDescription>
              </EmptyHeader>
              {!catalog.unavailable && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setCategory("Todas");
                    setPage(0);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resseguradora</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Código FIP</TableHead>
                  <TableHead>Autorização / cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((record) => (
                  <TableRow key={record.chave_monitoramento}>
                    <TableCell className="max-w-80 whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{record.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {record.site || "Site não informado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.tipo === categories[1]
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {categoryLabel(record.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {record.cnpj || "—"}
                    </TableCell>
                    <TableCell>{record.codigo_fip || "—"}</TableCell>
                    <TableCell>
                      {record.data_autorizacao_cadastramento || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Página {page + 1} de {maxPage + 1}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft data-icon="inline-start" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= maxPage}
              onClick={() => setPage(page + 1)}
              aria-label="Próxima página"
            >
              Próxima <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
        Os dados refletem a coleta na fonte pública. Ausência nos resultados não
        comprova cancelamento de licença. E-mails cadastrais exportados não
        foram verificados como canais de subscrição.
      </p>
    </>
  );
}
