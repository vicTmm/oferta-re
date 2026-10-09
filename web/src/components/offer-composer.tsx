"use client";
import { DepartmentField } from "./department-field";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { SubmitButton } from "./submit-button";
import { TextField } from "./workspace-ui";
import { prepareOffer } from "@/app/workspace/flows";
type Template = {
  id: string;
  subject: string;
  body: string;
  signature: string;
  version: number;
  label: string;
};
type Contact = { id: string; name: string; email: string; company: string };
export function OfferComposer({
  departments = [],
  org,
  templates,
  contacts,
  initial,
  demo = false,
  operation,
  offerId,
  draft,
}: {
  departments?: { id: string; name: string }[];
  org: string;
  templates: Template[];
  contacts: Contact[];
  initial?: string;
  demo?: boolean;
  operation?: { id: string; title: string; reference: string };
  offerId?: string;
  draft?: { subject: string; body: string; signature: string };
}) {
  const template = templates.find((t) => t.id === initial);
  const [selected, setSelected] = useState(template?.id ?? "");
  const [subject, setSubject] = useState(
    template?.subject ?? draft?.subject ?? "",
  );
  const [body, setBody] = useState(template?.body ?? draft?.body ?? "");
  const [signature, setSignature] = useState(
    template?.signature ?? draft?.signature ?? "",
  );
  const [chosen, setChosen] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const unresolved = /\{\{[^}]+\}\}/.test(subject + body + signature);
  return (
    <form
      action={demo ? undefined : prepareOffer}
      onSubmit={demo ? (e) => e.preventDefault() : undefined}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="org" value={org} />
      {operation && (
        <input type="hidden" name="operation_id" value={operation.id} />
      )}
      {offerId && <input type="hidden" name="offer_id" value={offerId} />}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {operation ? "Oferta ao mercado" : "Dados da proposta"}
            </CardTitle>
            <CardDescription>
              Uma referência única para organizar oferta, anexos e respostas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {!operation && (
                <>
                  {" "}
                  <DepartmentField departments={departments} />{" "}
                  <TextField
                    label="Referência interna"
                    name="reference"
                    required
                    maxLength={120}
                    placeholder="OF-2026-001"
                  />
                  <TextField
                    label="Título da operação"
                    name="title"
                    required
                    maxLength={200}
                    placeholder="Renovação patrimonial"
                  />
                  <TextField
                    label="Cedente"
                    name="cedent_name"
                    required
                    maxLength={200}
                  />
                  <TextField
                    label="Contrato (opcional)"
                    name="contract_reference"
                    maxLength={120}
                  />
                </>
              )}
              {operation && (
                <p className="rounded-lg bg-accent p-3 text-sm">
                  {operation.reference} · {operation.title}
                </p>
              )}
              <Field>
                <FieldLabel htmlFor="template_version_id">
                  Modelo de partida
                </FieldLabel>
                <select
                  className="h-10 rounded-lg border bg-background px-3 text-sm"
                  id="template_version_id"
                  name="template_version_id"
                  value={selected}
                  onChange={(e) => {
                    const t = templates.find((t) => t.id === e.target.value);
                    setSelected(e.target.value);
                    if (t) {
                      setSubject(t.subject);
                      setBody(t.body);
                      setSignature(t.signature);
                    }
                  }}
                >
                  <option value="">Texto próprio</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} · v{t.version}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="subject">Assunto</FieldLabel>
                <Input
                  id="subject"
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={300}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="body">Corpo do e-mail</FieldLabel>
                <Textarea
                  id="body"
                  name="body"
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  maxLength={20000}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="signature">Assinatura</FieldLabel>
                <Textarea
                  id="signature"
                  name="signature"
                  rows={3}
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  maxLength={5000}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Destinatários</CardTitle>
              <CardDescription>
                {chosen.length} selecionados · máximo de 100 contatos por oferta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="contact-search">
                    Buscar na sua base
                  </FieldLabel>
                  <Input
                    id="contact-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nome, empresa ou e-mail"
                  />
                </Field>
                <FieldSet>
                  <FieldLegend>Selecionar contatos</FieldLegend>
                  <div className="flex max-h-72 flex-col gap-4 overflow-auto">
                    {contacts
                      .filter((c) =>
                        `${c.name} ${c.company} ${c.email}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((c) => (
                        <Field key={c.id} orientation="horizontal">
                          <Checkbox
                            id={c.id}
                            checked={chosen.includes(c.id)}
                            onCheckedChange={(checked) =>
                              setChosen((old) =>
                                checked
                                  ? [...old, c.id]
                                  : old.filter((id) => id !== c.id),
                              )
                            }
                          />
                          <FieldLabel
                            htmlFor={c.id}
                            className="flex flex-col items-start gap-1"
                          >
                            <span>
                              {c.name} · {c.company}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {c.email}
                            </span>
                          </FieldLabel>
                        </Field>
                      ))}
                    {!contacts.length && (
                      <p className="text-sm text-muted-foreground">
                        Cadastre contatos antes de preparar uma oferta.
                      </p>
                    )}
                  </div>
                </FieldSet>
              </FieldGroup>
              {chosen.map((id) => (
                <input key={id} type="hidden" name="contacts" value={id} />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Prévia do e-mail</CardTitle>
              <CardDescription>
                O texto será preservado para os destinatários selecionados.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="font-medium">{subject || "Assunto da oferta"}</p>
              <p className="whitespace-pre-wrap text-sm">
                {body || "Escreva o corpo do e-mail para visualizar aqui."}
              </p>
              {signature && (
                <p className="whitespace-pre-wrap border-t pt-4 text-sm text-muted-foreground">
                  {signature}
                </p>
              )}
              {unresolved && (
                <p role="alert" className="text-sm text-destructive">
                  Substitua os campos entre chaves antes de preparar a oferta.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Salvar prepara o registro da oferta. O envio e a criação de
                rascunhos no Outlook serão etapas separadas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <SubmitButton
        disabled={demo || !chosen.length || chosen.length > 100 || unresolved}
      >
        Preparar oferta para revisão
      </SubmitButton>
    </form>
  );
}
