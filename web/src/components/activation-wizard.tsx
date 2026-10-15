"use client";
import { HelpTooltip, TooltipHint } from "./tooltip-hint";
import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Layers3,
  Settings2,
  ClipboardCheck,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import {
  areas,
  validateSetup,
  type CompanySetup,
  type SectorSetup,
  type SetupResult,
} from "@/lib/onboarding";
import { Button, buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Field, FieldLabel, FieldGroup } from "./ui/field";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
const steps = [
  ["Empresa", Building2],
  ["Estrutura", Layers3],
  ["Rotina", Settings2],
  ["Revisão", ClipboardCheck],
] as const;
const selectClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-ring";
function LineInput({
  sector,
  change,
  index,
}: {
  sector: SectorSetup;
  change: (lines: string[]) => void;
  index: number;
}) {
  const [text, setText] = useState(sector.lines.join(", "));
  return (
    <Field>
      <div className="flex items-center gap-1.5">
        <FieldLabel htmlFor={`lines-${index}`}>
          Linhas de negócio (opcional)
        </FieldLabel>
        <HelpTooltip
          label="Linhas de negócio"
          content="Especialidades usadas pela sua empresa, como Property, Engenharia ou Transportes. Uma linha pode pertencer a vários setores; não é uma classificação regulatória automática."
        />
      </div>
      <Input
        id={`lines-${index}`}
        value={text}
        maxLength={2450}
        placeholder="Property, Engenharia, Transportes"
        onChange={(e) => {
          setText(e.target.value);
          change(
            e.target.value
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean),
          );
        }}
      />
      <p className="text-xs text-muted-foreground">
        Separe por vírgulas. A mesma linha pode atender vários setores.
      </p>
    </Field>
  );
}
export function ActivationWizard({
  initial,
  revision: initialRevision,
  completed,
  orgId,
  demo = false,
  save,
}: {
  initial: CompanySetup;
  revision: number;
  completed: boolean;
  orgId?: string;
  demo?: boolean;
  save?: (
    payload: CompanySetup,
    complete: boolean,
    revision: number,
  ) => Promise<SetupResult>;
}) {
  const [data, setData] = useState(initial),
    [step, setStep] = useState(initial.step),
    [revision, setRevision] = useState(initialRevision);
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [done, setDone] = useState(false);
  const [sectorKeys, setSectorKeys] = useState(
    initial.sectors.map((s, i) => s.id ?? `initial-${i}`),
  );
  const busy = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const backUrl = demo ? "/demonstracao" : `/workspace?org=${orgId}`;
  function update<K extends keyof CompanySetup>(
    key: K,
    value: CompanySetup[K],
  ) {
    setData((prev) => ({ ...prev, [key]: value }));
    setNotice("");
  }
  function updateSector(index: number, patch: Partial<SectorSetup>) {
    setData((prev) => ({
      ...prev,
      sectors: prev.sectors.map((s, i) =>
        i === index ? { ...s, ...patch } : s,
      ),
    }));
    setNotice("");
  }
  function navigate(next: number) {
    setStep(next);
    setError("");
    setNotice("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function persist(complete = false, next = step) {
    if (busy.current) return;
    const checked = validateSetup({ ...data, step: next }, complete);
    if ("error" in checked) {
      setError(checked.error!);
      return;
    }
    if (
      step === 0 &&
      next > step &&
      (data.name.trim().length < 2 ||
        data.administrator.trim().length < 2 ||
        !data.email)
    ) {
      setError(
        "Preencha a empresa, o responsável e seu e-mail para continuar.",
      );
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    setNotice("");
    try {
      const result: SetupResult = demo
        ? { revision: revision + 1, payload: checked.payload, complete }
        : await save!(checked.payload, complete, revision);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setRevision(result.revision);
      setData(result.payload);
      setSectorKeys(
        result.payload.sectors.map((s) => s.id ?? crypto.randomUUID()),
      );
      setStep(next);
      if (complete) setDone(true);
      else
        setNotice(
          demo
            ? "Progresso simulado nesta página. Nenhum dado foi enviado."
            : "Progresso salvo. Você pode retomar a configuração depois.",
        );
      if (next !== step) requestAnimationFrame(() => heading.current?.focus());
    } catch {
      setError(
        "A conexão falhou. Seus campos continuam aqui; tente salvar novamente.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const textField = (
    key: keyof CompanySetup,
    label: string,
    max: number,
    type = "text",
    hint?: string,
  ) => (
    <Field key={key}>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      <Input
        id={key}
        value={data[key] as string}
        type={type}
        maxLength={max}
        onChange={(e) => update(key, e.target.value as never)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Field>
  );
  const choice = (
    key: keyof CompanySetup,
    label: string,
    options: [string, string][],
  ) => (
    <Field key={key}>
      <div className="flex items-center gap-1.5">
        <FieldLabel htmlFor={key}>{label}</FieldLabel>
        {key === "mailbox" && (
          <HelpTooltip
            label="Conta de envio"
            content="Conta individual é a caixa de uma pessoa; compartilhada é a caixa usada pela equipe. Esta escolha registra uma preferência e não conecta o Outlook."
          />
        )}
      </div>
      <select
        id={key}
        className={selectClass}
        value={data[key] as string}
        onChange={(e) => update(key, e.target.value as never)}
      >
        <option value="">Configurar depois</option>
        {options.map(([value, title]) => (
          <option key={value} value={value}>
            {title}
          </option>
        ))}
      </select>
    </Field>
  );
  if (done)
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Alert className="border-success/20 bg-success-soft text-success">
          <Check />
          <AlertTitle>
            {demo ? "Configuração demonstrada" : "Empresa configurada"}
          </AlertTitle>
          <AlertDescription>
            {demo
              ? "Este teste não cria empresa nem salva dados no Supabase."
              : "Seu ambiente está disponível. Complete a preparação da equipe quando quiser."}
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Próximos passos</CardTitle>
            <CardDescription>
              Comece com uma operação e amplie a base aos poucos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["equipe", "Convidar a equipe"],
              ["contatos", "Cadastrar contatos"],
              ["modelos", "Criar um modelo"],
              ["propostas", "Cadastrar a primeira proposta"],
            ].map(([path, label]) => (
              <Link
                key={path}
                href={
                  demo
                    ? `/demonstracao?tela=${path}`
                    : `/workspace/${path}?org=${orgId}`
                }
                className="rounded-xl border p-4 text-sm font-medium text-primary hover:bg-accent"
              >
                {label}
                <ArrowRight className="ml-2 inline size-4" />
              </Link>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Link href={backUrl} className={buttonVariants()}>
            Ir para o ambiente
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              setDone(false);
              navigate(0);
            }}
          >
            Revisar configuração
          </Button>
        </div>
      </div>
    );
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          {demo ? "Demonstração · dados fictícios" : "Configuração da empresa"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Configure sua corretora
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Defina os dados da empresa, os setores e as preferências de trabalho.
          Você pode salvar o progresso e completar os detalhes depois.
        </p>
      </header>
      {demo && (
        <Alert>
          <AlertTitle>Experimente o formulário</AlertTitle>
          <AlertDescription>
            O salvamento é simulado e vale apenas enquanto esta página estiver
            aberta. Não preencha informações confidenciais.
          </AlertDescription>
        </Alert>
      )}
      {completed && (
        <p className="text-sm text-muted-foreground">
          Sua empresa já foi configurada. As alterações serão salvas no mesmo
          ambiente.
        </p>
      )}
      <ol
        aria-label="Etapas da configuração"
        className="grid grid-cols-4 gap-2"
      >
        {steps.map(([label, Icon], index) => (
          <li key={label}>
            <button
              type="button"
              disabled={pending || index > step}
              onClick={() => navigate(index)}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex h-full w-full flex-col items-center gap-2 border-b-2 px-2 py-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring sm:flex-row sm:justify-start sm:text-sm",
                index === step
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground",
                index > step && "opacity-60",
              )}
            >
              <Icon className="size-4" />
              <span>
                {index + 1}. {label}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void persist(step === 3, Math.min(step + 1, 3));
        }}
        className="flex flex-col gap-5"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 ref={heading} tabIndex={-1} className="outline-none">
                {
                  [
                    "Dados da empresa",
                    "Áreas, setores e linhas",
                    "Como vocês trabalham",
                    "Confira antes de concluir",
                  ][step]
                }
              </h2>
            </CardTitle>
            <CardDescription>
              {
                [
                  "Os dados do responsável administram a conta. Cada pessoa da equipe terá seu próprio login.",
                  "Escolha a nomenclatura usada pela sua equipe. A estrutura pode ser completada depois.",
                  "Esta etapa é opcional. As respostas ajudam a preparar a implantação e a avaliar o piloto do produto.",
                  "A configuração organiza o ambiente compartilhado da sua empresa.",
                ][step]
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset disabled={pending} className="min-w-0">
              {step === 0 && (
                <FieldGroup>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {textField("name", "Nome da empresa *", 120)}
                    {textField("administrator", "Nome do responsável *", 120)}
                    {textField(
                      "email",
                      "E-mail do responsável *",
                      254,
                      "email",
                    )}
                    {textField("phone", "Telefone (opcional)", 40, "tel")}
                  </div>
                  <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Dados comerciais e site (opcionais)
                    </summary>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      {textField("legalName", "Razão social", 160)}
                      {textField(
                        "cnpj",
                        "CNPJ",
                        24,
                        "text",
                        "Informação de cadastro; sem validação cadastral automática.",
                      )}
                      {textField(
                        "billingEmail",
                        "E-mail financeiro",
                        254,
                        "email",
                      )}
                      {textField(
                        "website",
                        "Site",
                        200,
                        "url",
                        "Inclua https:// no endereço.",
                      )}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Esses dados ficam acessíveis apenas ao responsável e aos
                      administradores. Preencher não gera cobrança.
                    </p>
                  </details>
                </FieldGroup>
              )}
              {step === 1 && (
                <FieldGroup>
                  <Field>
                    <div className="flex items-center gap-1.5">
                      <FieldLabel>Áreas de atuação</FieldLabel>
                      <HelpTooltip
                        label="Áreas de atuação"
                        content="Selecione uma ou várias áreas em que a empresa atua. Os setores e as linhas de negócio serão definidos abaixo com os nomes usados pela equipe."
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(areas).map(([key, label]) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={data.areas.includes(
                              key as keyof typeof areas,
                            )}
                            onChange={(e) =>
                              update(
                                "areas",
                                e.target.checked
                                  ? [...data.areas, key as keyof typeof areas]
                                  : data.areas.filter((a) => a !== key),
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">Setores da empresa</h3>
                    <Badge variant="secondary">
                      {data.sectors.length} / 30
                    </Badge>
                  </div>
                  {!data.sectors.length && (
                    <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                      Você pode cadastrar os setores agora ou continuar. Ao
                      concluir sem setores, criaremos o setor Geral.
                    </div>
                  )}
                  {data.sectors.map((sector, index) => (
                    <div
                      key={sectorKeys[index]}
                      className="flex flex-col gap-4 rounded-xl border bg-background/50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Setor {index + 1}
                        </p>
                        {!sector.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Remover setor ${index + 1}`}
                            onClick={() => {
                              setSectorKeys((keys) =>
                                keys.filter((_, i) => i !== index),
                              );
                              update(
                                "sectors",
                                data.sectors.filter((_, i) => i !== index),
                              );
                            }}
                          >
                            <Trash2 />
                            Remover
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor={`sector-${index}`}>
                            Nome do setor
                          </FieldLabel>
                          <Input
                            id={`sector-${index}`}
                            value={sector.name}
                            maxLength={100}
                            placeholder="Ex.: Soluções Estruturadas"
                            onChange={(e) =>
                              updateSector(index, { name: e.target.value })
                            }
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`area-${index}`}>
                            Área
                          </FieldLabel>
                          <select
                            className={selectClass}
                            id={`area-${index}`}
                            value={sector.area}
                            onChange={(e) =>
                              updateSector(index, {
                                area: e.target.value as SectorSetup["area"],
                              })
                            }
                          >
                            {Object.entries(areas).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <LineInput
                        sector={sector}
                        index={index}
                        change={(lines) => updateSector(index, { lines })}
                      />
                      {sector.id && (
                        <p className="text-xs text-muted-foreground">
                          Setor existente: seus registros e membros serão
                          preservados.
                        </p>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={data.sectors.length >= 30}
                    onClick={() => {
                      setSectorKeys((keys) => [...keys, crypto.randomUUID()]);
                      update("sectors", [
                        ...data.sectors,
                        { name: "", area: data.areas[0] ?? "other", lines: [] },
                      ]);
                    }}
                  >
                    <Plus />
                    Adicionar setor
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Linhas são classificações internas, sem equivalência
                    automática com ramos da SUSEP. Contatos, modelos e ofertas
                    continuam compartilhados entre os setores da empresa.
                  </p>
                </FieldGroup>
              )}
              {step === 2 && (
                <FieldGroup>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {choice("outlook", "Ferramenta de e-mail", [
                      ["classic", "Outlook clássico"],
                      ["new", "Novo Outlook"],
                      ["web", "Outlook web"],
                      ["other", "Outra ferramenta"],
                    ])}
                    {choice("mailbox", "Conta de envio", [
                      ["individual", "Individual"],
                      ["shared", "Caixa compartilhada"],
                    ])}
                    {textField(
                      "senderEmail",
                      "Endereço usado nas ofertas (opcional)",
                      254,
                      "email",
                    )}
                    {choice(
                      "hasContacts",
                      "Já existe uma base própria de contatos?",
                      [
                        ["yes", "Sim"],
                        ["no", "Não"],
                      ],
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estas são preferências de implantação. Nenhuma caixa postal
                    será conectada e nenhum e-mail será enviado.
                  </p>
                  <Field>
                    <FieldLabel>
                      Formatos de comprovantes mais usados
                    </FieldLabel>
                    <div className="flex flex-wrap gap-3">
                      {[
                        ["msg", ".msg"],
                        ["eml", ".eml"],
                        ["pdf", "PDF"],
                        ["image", "Imagens"],
                        ["other", "Outros"],
                      ].map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={data.evidence.includes(key)}
                            onChange={(e) =>
                              update(
                                "evidence",
                                e.target.checked
                                  ? [...data.evidence, key]
                                  : data.evidence.filter((a) => a !== key),
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </Field>
                  {textField(
                    "reference",
                    "Exemplo de referência interna de contrato (opcional)",
                    120,
                    "text",
                    "Use um exemplo fictício, sem dados do segurado.",
                  )}
                  <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Ajude a planejar o piloto (opcional)
                    </summary>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      {choice("users", "Pessoas que usarão o ambiente", [
                        ["1-5", "1 a 5"],
                        ["6-20", "6 a 20"],
                        ["21-50", "21 a 50"],
                        ["51+", "Mais de 50"],
                      ])}
                      {choice("monthlyOffers", "Ofertas ao mercado por mês", [
                        ["1-20", "1 a 20"],
                        ["21-100", "21 a 100"],
                        ["101-500", "101 a 500"],
                        ["501+", "Mais de 500"],
                      ])}
                    </div>
                    <div className="mt-5 flex flex-col gap-5">
                      {textField("tools", "Ferramentas usadas hoje", 500)}
                      {(
                        [
                          ["pain", "O que mais toma tempo hoje?"],
                          ["goal", "Qual resultado esperam alcançar?"],
                        ] as const
                      ).map(([key, label]) => (
                        <Field key={key}>
                          <FieldLabel htmlFor={key}>{label}</FieldLabel>
                          <Textarea
                            id={key}
                            value={data[key]}
                            rows={3}
                            maxLength={1000}
                            onChange={(e) => update(key, e.target.value)}
                          />
                        </Field>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      As faixas ajudam a estimar capacidade e suporte; não
                      determinam preço. As respostas também apoiam a avaliação
                      do produto e o registro das decisões do projeto.
                    </p>
                  </details>
                </FieldGroup>
              )}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Empresa</p>
                      <p className="mt-1 font-medium">
                        {data.name || "Não informado"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {data.legalName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Responsável
                      </p>
                      <p className="mt-1 font-medium">
                        {data.administrator || "Não informado"}
                      </p>
                      <p className="mt-1 break-all text-sm text-muted-foreground">
                        {data.email}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Áreas</p>
                    <div className="flex flex-wrap gap-2">
                      {data.areas.length ? (
                        data.areas.map((a) => (
                          <Badge key={a} variant="secondary">
                            {areas[a]}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm">Configurar depois</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Setores e linhas
                    </p>
                    {data.sectors.length ? (
                      <div className="flex flex-col gap-2">
                        {data.sectors.map((s, i) => (
                          <div key={i} className="rounded-xl border p-4">
                            <p className="text-sm font-medium">
                              {s.name}{" "}
                              <span className="font-normal text-muted-foreground">
                                · {areas[s.area]}
                              </span>
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {s.lines.join(" · ") || "Linhas a configurar"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">
                        Setor Geral; estrutura detalhada depois.
                      </p>
                    )}
                  </div>
                  <details className="rounded-xl border p-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Revisar dados opcionais
                    </summary>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      {[
                        ["CNPJ", data.cnpj],
                        ["E-mail financeiro", data.billingEmail],
                        ["Site", data.website],
                        ["Telefone", data.phone],
                        [
                          "Ferramenta de e-mail",
                          (
                            {
                              classic: "Outlook clássico",
                              new: "Novo Outlook",
                              web: "Outlook web",
                              other: "Outra",
                            } as Record<string, string>
                          )[data.outlook],
                        ],
                        [
                          "Conta de envio",
                          (
                            {
                              individual: "Individual",
                              shared: "Compartilhada",
                            } as Record<string, string>
                          )[data.mailbox],
                        ],
                        ["Remetente", data.senderEmail],
                        [
                          "Base própria de contatos",
                          ({ yes: "Sim", no: "Não" } as Record<string, string>)[
                            data.hasContacts
                          ],
                        ],
                        ["Comprovantes", data.evidence.join(", ")],
                        ["Referência interna", data.reference],
                        ["Usuários", data.users],
                        ["Ofertas ao mercado por mês", data.monthlyOffers],
                        ["Ferramentas atuais", data.tools],
                        ["Principal dificuldade", data.pain],
                        ["Resultado esperado", data.goal],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="mt-1 break-words whitespace-pre-wrap">
                            {value || "Não informado"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  <Alert>
                    <AlertTitle>Próximas configurações</AlertTitle>
                    <AlertDescription>
                      Convide a equipe, cadastre sua base autorizada de contatos
                      e crie os modelos no ambiente. Você poderá editar esta
                      configuração depois.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </fieldset>
          </CardContent>
        </Card>
        <div aria-live="polite" role="status">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Confira a configuração</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {notice && <p className="text-sm text-success">{notice}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => navigate(step - 1)}
              >
                <ArrowLeft />
                Voltar
              </Button>
            ) : (
              <Link
                href={backUrl}
                className={buttonVariants({ variant: "ghost" })}
              >
                Voltar ao ambiente
              </Link>
            )}
            <TooltipHint
              content={
                demo
                  ? "Simula o salvamento nesta página. Ao recarregar, a demonstração volta ao início."
                  : "Salva a etapa atual no ambiente da empresa para você retomar depois. Não conclui a configuração."
              }
            >
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => void persist()}
              >
                <Save />
                {pending ? "Salvando…" : "Salvar progresso"}
              </Button>
            </TooltipHint>
          </div>
          <Button type="submit" disabled={pending}>
            {step === 3
              ? "Concluir configuração"
              : step === 2
                ? "Continuar para revisão"
                : "Salvar e continuar"}
            {step === 3 ? <Check /> : <ArrowRight />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          * Campos necessários para concluir. Contatos e anexos não são exigidos
          nesta etapa.
        </p>
      </form>
    </div>
  );
}
