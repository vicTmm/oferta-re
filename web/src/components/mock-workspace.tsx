"use client";
import { useEffect, useState, useId, type FormEvent } from "react";
import Link from "next/link";
import { normalize } from "@/lib/catalog-utils";
import { ProposalBoard } from "./proposal-board";
import { ProposalForm } from "./proposal-form";
import { OfferComposer } from "./offer-composer";
import {
  ProposalDetail,
  responseLabels,
  type PortalVersion,
  type PortalRecipient,
  type PortalResponse,
  type PortalEvent,
} from "./proposal-detail";
import {
  demoProposalData,
  demoLines,
  portalDemoDepartments,
} from "@/lib/demo-proposals";
import { brazilToday, type Proposal } from "@/lib/proposals";
import { Button, buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Field, FieldLabel } from "./ui/field";

type Contact = { id: string; name: string; email: string; company: string };
type Template = {
  id: string;
  label: string;
  subject: string;
  body: string;
  signature: string;
  version: number;
};
type Document = {
  id: string;
  operation_id: string;
  name: string;
  content: string;
  kind: string;
};
type MockState = {
  proposals: Proposal[];
  contacts: Contact[];
  templates: Template[];
  departments: { id: string; name: string }[];
  members: { id: string; name: string; email: string; role: string }[];
  versions: (PortalVersion & { operation_id: string })[];
  recipients: PortalRecipient[];
  responses: PortalResponse[];
  events: (PortalEvent & { operation_id: string })[];
  documents: Document[];
};
const storageKey = "oferta-re-mock-v1";
const uid = () => crypto.randomUUID();
function seed(): MockState {
  return {
    proposals: demoProposalData(brazilToday()),
    departments: portalDemoDepartments,
    contacts: [
      {
        id: "contact-a",
        name: "Marina Souza",
        email: "marina@example.com",
        company: "Mercado Exemplo A",
      },
      {
        id: "contact-b",
        name: "Rafael Lima",
        email: "rafael@example.com",
        company: "Mercado Exemplo B",
      },
    ],
    templates: [
      {
        id: "template-a",
        label: "Oferta facultativa",
        subject: "Oferta de resseguro",
        body: "Prezados,\n\nEncaminhamos os termos para análise.\n\nAguardamos seu retorno.",
        signature: "Ana Costa\nCorretora Exemplo",
        version: 1,
      },
    ],
    members: [
      {
        id: "member-a",
        name: "Ana Costa",
        email: "ana@example.com",
        role: "Responsável",
      },
    ],
    versions: [],
    recipients: [],
    responses: [],
    events: [],
    documents: [],
  };
}
const screens: Record<string, string> = {
  propostas: "Propostas e renovações",
  contatos: "Contatos",
  modelos: "Modelos",
  ofertas: "Ofertas",
  comprovantes: "Comprovantes",
  equipe: "Setores e equipe",
};
const selectClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm";
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="workspace-section">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}
function TextField({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} name={name} type={type} required={required} />
    </Field>
  );
}
export function MockWorkspace({
  screen = "propostas",
  proposalId,
  renewId,
}: {
  screen?: string;
  proposalId?: string;
  renewId?: string;
}) {
  const [data, setData] = useState<MockState | null>(null);
  const [notice, setNotice] = useState("");
  const [renewFrom, setRenewFrom] = useState<Proposal>();
  const [operationId, setOperationId] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [contactQuery, setContactQuery] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      const initial: MockState =
        parsed && Object.keys(seed()).every((key) => Array.isArray(parsed[key]))
          ? parsed
          : seed();
      setData(initial);
      setRenewFrom(initial.proposals.find((p) => p.id === renewId));
    } catch {
      setData(seed());
      setNotice(
        "Não foi possível ler os dados locais. Uma nova demonstração foi carregada.",
      );
    }
  }, [renewId]);
  function commit(next: MockState, message: string) {
    setData(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice(message);
    } catch {
      setNotice(
        `${message} O navegador não permitiu persistir os dados; eles serão perdidos ao sair desta tela.`,
      );
    }
  }
  if (!data) return <p role="status">Carregando ambiente mock…</p>;
  const state = data;
  const proposal = state.proposals.find((p) => p.id === proposalId);
  const operation =
    state.proposals.find((p) => p.id === operationId) ?? state.proposals[0];
  function event(
    operation_id: string,
    event_type: string,
    note: string,
    stage: Proposal["stage"],
    from_stage?: string,
  ) {
    return {
      id: uid(),
      operation_id,
      event_type,
      note,
      to_stage: stage,
      from_stage,
      created_at: new Date().toISOString(),
    };
  }
  function saveProposal(form: FormData, current?: Proposal) {
    const values = Object.fromEntries(form.entries());
    const next = {
      ...current,
      ...values,
      id: current?.id ?? uid(),
      proposal_revision: (current?.proposal_revision ?? 0) + 1,
      closure_note: String(values.closure_note ?? ""),
      next_action: String(values.next_action ?? ""),
    } as Proposal;
    if (
      next.coverage_start &&
      next.coverage_end &&
      next.coverage_end < next.coverage_start
    ) {
      setNotice("O fim da vigência deve ser posterior ao início.");
      return;
    }
    if (
      state.proposals.some(
        (p) => p.reference === next.reference && p.id !== next.id,
      )
    ) {
      setNotice("Já existe uma proposta com esta referência.");
      return;
    }
    commit(
      {
        ...state,
        proposals: current
          ? state.proposals.map((p) => (p.id === next.id ? next : p))
          : [...state.proposals, next],
        events: [
          event(
            next.id,
            current ? "stage_changed" : "created",
            next.next_action,
            next.stage,
            current?.stage,
          ),
          ...state.events,
        ],
      },
      "Proposta salva no ambiente mock.",
    );
    if (!current) {
      setRenewFrom(undefined);
      setFormKey((k) => k + 1);
    }
  }
  function submit(
    e: FormEvent<HTMLFormElement>,
    handle: (form: FormData) => void,
  ) {
    e.preventDefault();
    const form = e.currentTarget;
    handle(new FormData(form));
    form.reset();
  }
  const operationSelect = (
    <Field>
      <FieldLabel htmlFor="mock-operation">Proposta</FieldLabel>
      <select
        id="mock-operation"
        className={selectClass}
        value={operation?.id ?? ""}
        onChange={(e) => setOperationId(e.target.value)}
      >
        {state.proposals.map((p) => (
          <option key={p.id} value={p.id}>
            {p.reference} · {p.title}
          </option>
        ))}
      </select>
    </Field>
  );
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">
            Corretora Exemplo · Ana Costa
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {proposalId
              ? "Acompanhamento da proposta"
              : (screens[screen] ?? "Propostas e renovações")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Demonstração interativa · dados salvos neste navegador.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (
              window.confirm(
                "Apagar seus testes e restaurar os dados fictícios?",
              )
            ) {
              commit(seed(), "Dados fictícios restaurados.");
              setRenewFrom(undefined);
              setOperationId("");
              setFormKey((k) => k + 1);
            }
          }}
        >
          Restaurar demonstração
        </Button>
      </div>
      <p className="border-l-2 border-primary/40 pl-3 text-xs leading-5 text-muted-foreground">
        Ambiente de teste. Envios e convites são simulados; nenhum e-mail é
        enviado. Anexos de até 1 MB ficam neste navegador.
      </p>
      <nav className="workspace-tabs" aria-label="Telas do ambiente mock">
        {Object.entries(screens).map(([key, label]) => (
          <Link
            key={key}
            href={`/demonstracao?tela=${key}`}
            aria-current={!proposalId && screen === key ? "page" : undefined}
            className="workspace-tab"
          >
            {label}
          </Link>
        ))}
        <Link href="/demonstracao/ativacao" className="workspace-tab">
          Configuração da empresa
        </Link>
      </nav>
      {notice && (
        <p role="status" className="rounded-xl border bg-accent p-4 text-sm">
          {notice}
        </p>
      )}
      {proposalId ? (
        proposal ? (
          <>
            <ProposalDetail
              proposal={proposal}
              org="demo"
              versions={state.versions.filter(
                (v) => v.operation_id === proposal.id,
              )}
              recipients={state.recipients}
              responses={state.responses}
              events={state.events.filter(
                (e) => e.operation_id === proposal.id,
              )}
              prior={state.proposals.find(
                (p) => p.id === proposal.prior_operation_id,
              )}
              department={
                state.departments.find((d) => d.id === proposal.department_id)
                  ?.name
              }
              line={
                demoLines.find((l) => l.id === proposal.business_line_id)?.name
              }
              demo
            />
            <Panel title="Editar acompanhamento">
              <ProposalForm
                key={proposal.id + formKey}
                org="demo"
                proposal={proposal}
                previous={state.proposals}
                departments={state.departments}
                lines={demoLines}
                demo
                onMockSubmit={(form) => saveProposal(form, proposal)}
              />
            </Panel>
            <Link
              href={`/demonstracao?tela=propostas&renovar=${proposal.id}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Iniciar renovação desta proposta
            </Link>
          </>
        ) : (
          <Panel title="Proposta não encontrada">
            <p>
              Este registro pode ter sido removido ao restaurar a demonstração.
            </p>
            <Link href="/demonstracao">Voltar à carteira</Link>
          </Panel>
        )
      ) : (
        <>
          {screen === "propostas" && (
            <>
              <ProposalBoard
                proposals={state.proposals}
                org="demo"
                departments={state.departments}
                lines={demoLines}
                today={brazilToday()}
                demo
              />
              <details
                key={renewFrom?.id ?? "new"}
                open={renewFrom ? true : undefined}
                className="proposal-create"
              >
                <summary className="cursor-pointer py-4 text-sm font-medium text-primary">
                  + Cadastrar proposta ou renovação
                </summary>
                <Panel title="Cadastrar proposta ou renovação">
                  <Field>
                    <FieldLabel htmlFor="renew-from">
                      Renovar uma proposta existente
                    </FieldLabel>
                    <select
                      id="renew-from"
                      className={selectClass}
                      value={renewFrom?.id ?? ""}
                      onChange={(e) => {
                        setRenewFrom(
                          state.proposals.find((p) => p.id === e.target.value),
                        );
                        setFormKey((k) => k + 1);
                      }}
                    >
                      <option value="">Novo negócio</option>
                      {state.proposals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.reference} · {p.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <ProposalForm
                    key={formKey}
                    org="demo"
                    departments={state.departments}
                    lines={demoLines}
                    previous={state.proposals}
                    renewFrom={renewFrom}
                    demo
                    onMockSubmit={(form) => saveProposal(form)}
                  />
                </Panel>
              </details>
            </>
          )}
          {screen === "contatos" && (
            <Panel title="Base de contatos">
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) =>
                  submit(e, (form) => {
                    const contact = {
                      id: uid(),
                      name: String(form.get("name")),
                      email: String(form.get("email")),
                      company: String(form.get("company")),
                    };
                    commit(
                      { ...state, contacts: [...state.contacts, contact] },
                      "Contato cadastrado.",
                    );
                  })
                }
              >
                <TextField name="name" label="Nome" />
                <TextField name="email" label="E-mail" type="email" />
                <TextField name="company" label="Resseguradora / empresa" />
                <Button type="submit">Adicionar contato</Button>
              </form>
              <Field>
                <FieldLabel htmlFor="mock-contact-search">
                  Buscar contato
                </FieldLabel>
                <Input
                  id="mock-contact-search"
                  type="search"
                  placeholder="Nome, empresa ou e-mail"
                  value={contactQuery}
                  onChange={(e) => setContactQuery(e.target.value)}
                />
              </Field>
              <p role="status" className="text-xs text-muted-foreground">
                {
                  state.contacts.filter((c) =>
                    normalize(`${c.name} ${c.email} ${c.company}`).includes(
                      normalize(contactQuery.trim()),
                    ),
                  ).length
                }{" "}
                contatos encontrados
              </p>
              {state.contacts
                .filter((c) =>
                  normalize(`${c.name} ${c.email} ${c.company}`).includes(
                    normalize(contactQuery.trim()),
                  ),
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b py-4"
                  >
                    <p>
                      {c.name} · {c.company}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {c.email}
                      </span>
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        commit(
                          {
                            ...state,
                            contacts: state.contacts.filter(
                              (item) => item.id !== c.id,
                            ),
                          },
                          "Contato removido. As ofertas anteriores preservam seus destinatários.",
                        )
                      }
                    >
                      Remover
                    </Button>
                  </div>
                ))}
            </Panel>
          )}
          {screen === "modelos" && (
            <Panel title="Modelos de oferta">
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) =>
                  submit(e, (form) =>
                    commit(
                      {
                        ...state,
                        templates: [
                          ...state.templates,
                          {
                            id: uid(),
                            label: String(form.get("label")),
                            subject: String(form.get("subject")),
                            body: String(form.get("body")),
                            signature: String(form.get("signature")),
                            version: 1,
                          },
                        ],
                      },
                      "Modelo cadastrado.",
                    ),
                  )
                }
              >
                <TextField name="label" label="Nome do modelo" />
                <TextField name="subject" label="Assunto" />
                <Field>
                  <FieldLabel htmlFor="mock-body">Texto</FieldLabel>
                  <Textarea id="mock-body" name="body" required />
                </Field>
                <TextField
                  name="signature"
                  label="Assinatura"
                  required={false}
                />
                <Button type="submit">Salvar modelo</Button>
              </form>
              {state.templates.map((t) => (
                <div key={t.id} className="border-b py-5">
                  <h3 className="font-medium">
                    {t.label} · v{t.version}
                  </h3>
                  <p>{t.subject}</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {t.body}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      commit(
                        {
                          ...state,
                          templates: state.templates.filter(
                            (item) => item.id !== t.id,
                          ),
                        },
                        "Modelo removido.",
                      )
                    }
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </Panel>
          )}
          {screen === "ofertas" && (
            <>
              {operationSelect}
              {operation && (
                <OfferComposer
                  key={operation.id}
                  org="demo"
                  departments={state.departments}
                  templates={state.templates}
                  contacts={state.contacts}
                  operation={operation}
                  demo
                  onMockSubmit={(form) => {
                    const versionId = uid();
                    const existing = state.versions.filter(
                      (v) => v.operation_id === operation.id,
                    );
                    const now = new Date().toISOString();
                    const version = {
                      id: versionId,
                      operation_id: operation.id,
                      offer_id: existing[0]?.offer_id ?? uid(),
                      version: existing.length + 1,
                      subject: String(form.get("subject")),
                      body: String(form.get("body")),
                      signature: String(form.get("signature")),
                      created_at: now,
                    };
                    const recipients = state.contacts
                      .filter((c) => form.getAll("contacts").includes(c.id))
                      .map((c) => ({
                        id: uid(),
                        offer_version_id: versionId,
                        destination_name: c.name,
                        destination_email: c.email,
                        status: "prepared",
                        sent_at: null,
                      }));
                    commit(
                      {
                        ...state,
                        versions: [...state.versions, version],
                        recipients: [...state.recipients, ...recipients],
                        events: [
                          event(
                            operation.id,
                            "offer_prepared",
                            `Versão ${version.version} preparada.`,
                            operation.stage,
                          ),
                          ...state.events,
                        ],
                      },
                      `Oferta v${version.version} preparada. Registre o envio simulado abaixo.`,
                    );
                  }}
                />
              )}
              {state.versions
                .filter((v) => v.operation_id === operation?.id)
                .map((v) => (
                  <Panel key={v.id} title={`${v.subject} · v${v.version}`}>
                    <p className="whitespace-pre-wrap text-sm">{v.body}</p>
                    {state.recipients
                      .filter((r) => r.offer_version_id === v.id)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-3 border-b py-4"
                        >
                          <p>
                            {r.destination_name} · {r.destination_email}
                          </p>
                          {r.sent_at ? (
                            <span>Envio simulado registrado</span>
                          ) : (
                            <Button
                              onClick={() =>
                                commit(
                                  {
                                    ...state,
                                    recipients: state.recipients.map((item) =>
                                      item.id === r.id
                                        ? {
                                            ...item,
                                            sent_at: new Date().toISOString(),
                                            status: "sent_confirmed",
                                          }
                                        : item,
                                    ),
                                    proposals: state.proposals.map((p) =>
                                      p.id === v.operation_id
                                        ? { ...p, stage: "market" }
                                        : p,
                                    ),
                                    events: [
                                      event(
                                        v.operation_id,
                                        "send_recorded",
                                        `Envio simulado para ${r.destination_name}.`,
                                        "market",
                                        operation?.stage,
                                      ),
                                      ...state.events,
                                    ],
                                  },
                                  "Envio simulado registrado. Nenhum e-mail foi enviado.",
                                )
                              }
                            >
                              Simular envio
                            </Button>
                          )}
                        </div>
                      ))}
                  </Panel>
                ))}
            </>
          )}
          {screen === "comprovantes" && (
            <Panel title="Documentos e respostas">
              {operationSelect}
              <Field>
                <FieldLabel htmlFor="mock-file">
                  Adicionar comprovante (até 1 MB)
                </FieldLabel>
                <Input
                  id="mock-file"
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file || !operation) return;
                    if (file.size > 1024 * 1024) {
                      setNotice("Escolha um arquivo de até 1 MB.");
                      return;
                    }
                    try {
                      const content = await new Promise<string>(
                        (resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(String(reader.result));
                          reader.onerror = reject;
                          reader.readAsDataURL(file);
                        },
                      );
                      commit(
                        {
                          ...state,
                          documents: [
                            ...state.documents,
                            {
                              id: uid(),
                              operation_id: operation.id,
                              name: file.name,
                              content,
                              kind: "Comprovante",
                            },
                          ],
                        },
                        "Comprovante adicionado localmente.",
                      );
                    } catch {
                      setNotice("Não foi possível ler o arquivo.");
                    }
                  }}
                />
              </Field>
              {state.documents
                .filter((d) => d.operation_id === operation?.id)
                .map((d) => (
                  <a
                    key={d.id}
                    href={d.content}
                    download={d.name}
                    className="text-primary underline"
                  >
                    Baixar {d.name}
                  </a>
                ))}
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) =>
                  submit(e, (form) => {
                    if (!operation) return;
                    const recipientId = String(form.get("recipient_id"));
                    if (!recipientId) return;
                    const response = {
                      id: uid(),
                      recipient_id: recipientId,
                      classification: String(form.get("classification")),
                      note: String(form.get("note")),
                      document_id: String(form.get("document_id")) || null,
                      responded_at: new Date().toISOString(),
                    };
                    commit(
                      {
                        ...state,
                        responses: [...state.responses, response],
                        proposals: state.proposals.map((p) =>
                          p.id === operation.id
                            ? { ...p, stage: "negotiation" }
                            : p,
                        ),
                        events: [
                          event(
                            operation.id,
                            "response_recorded",
                            response.note,
                            "negotiation",
                            operation.stage,
                          ),
                          ...state.events,
                        ],
                      },
                      "Resposta fictícia registrada.",
                    );
                  })
                }
              >
                <Field>
                  <FieldLabel htmlFor="mock-recipient">
                    Destinatário da oferta
                  </FieldLabel>
                  <select
                    id="mock-recipient"
                    className={selectClass}
                    name="recipient_id"
                    required
                  >
                    <option value="">Selecione um destinatário</option>
                    {state.recipients
                      .filter((r) =>
                        state.versions.some(
                          (v) =>
                            v.id === r.offer_version_id &&
                            v.operation_id === operation?.id,
                        ),
                      )
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.destination_name} · v
                          {
                            state.versions.find(
                              (v) => v.id === r.offer_version_id,
                            )?.version
                          }
                        </option>
                      ))}
                  </select>
                </Field>
                <p className="text-sm text-muted-foreground">
                  Prepare uma oferta na aba Ofertas para selecionar seus
                  destinatários aqui.
                </p>
                <Field>
                  <FieldLabel htmlFor="mock-classification">
                    Classificação
                  </FieldLabel>
                  <select
                    id="mock-classification"
                    className={selectClass}
                    name="classification"
                  >
                    {Object.entries(responseLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="mock-note">Observações</FieldLabel>
                  <Textarea id="mock-note" name="note" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="mock-document">
                    Comprovante vinculado
                  </FieldLabel>
                  <select
                    id="mock-document"
                    className={selectClass}
                    name="document_id"
                    required
                  >
                    <option value="">Selecione um comprovante</option>
                    {state.documents
                      .filter((d) => d.operation_id === operation?.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Button type="submit">Registrar resposta</Button>
              </form>
              {state.responses
                .filter((r) =>
                  state.recipients.some(
                    (rec) =>
                      rec.id === r.recipient_id &&
                      state.versions.some(
                        (v) =>
                          v.id === rec.offer_version_id &&
                          v.operation_id === operation?.id,
                      ),
                  ),
                )
                .map((r) => (
                  <div key={r.id} className="border-b py-5">
                    <p className="font-medium">
                      {responseLabels[r.classification]}
                    </p>
                    <p>{r.note}</p>
                  </div>
                ))}
            </Panel>
          )}
          {screen === "equipe" && (
            <>
              <Panel title="Setores">
                <form
                  className="flex flex-wrap gap-3"
                  onSubmit={(e) =>
                    submit(e, (form) =>
                      commit(
                        {
                          ...state,
                          departments: [
                            ...state.departments,
                            { id: uid(), name: String(form.get("name")) },
                          ],
                        },
                        "Setor cadastrado.",
                      ),
                    )
                  }
                >
                  <TextField name="name" label="Nome do setor" />
                  <Button type="submit">Adicionar setor</Button>
                </form>
                {state.departments.map((d) => (
                  <p key={d.id}>{d.name}</p>
                ))}
              </Panel>
              <Panel title="Equipe e convites simulados">
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={(e) =>
                    submit(e, (form) =>
                      commit(
                        {
                          ...state,
                          members: [
                            ...state.members,
                            {
                              id: uid(),
                              name: String(form.get("name")),
                              email: String(form.get("email")),
                              role: String(form.get("role")),
                            },
                          ],
                        },
                        "Pessoa adicionada à equipe fictícia. Nenhum convite foi enviado.",
                      ),
                    )
                  }
                >
                  <TextField name="name" label="Nome" />
                  <TextField name="email" label="E-mail" type="email" />
                  <Field>
                    <FieldLabel htmlFor="mock-role">Permissão</FieldLabel>
                    <select id="mock-role" name="role" className={selectClass}>
                      <option>Colaborador</option>
                      <option>Consulta</option>
                      <option>Responsável</option>
                    </select>
                  </Field>
                  <Button type="submit">Simular convite</Button>
                </form>
                {state.members.map((m) => (
                  <p key={m.id}>
                    {m.name} · {m.email} · {m.role}
                  </p>
                ))}
              </Panel>
            </>
          )}
        </>
      )}
    </>
  );
}
