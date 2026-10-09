import { ProposalBoard } from "@/components/proposal-board";
import { ProposalForm } from "@/components/proposal-form";
import {
  demoProposalData,
  demoLines,
  portalDemoDepartments,
} from "@/lib/demo-proposals";
import { brazilToday } from "@/lib/proposals";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OfferComposer } from "@/components/offer-composer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
const demoContacts = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Marina Souza",
    email: "marina@example.com",
    company: "Resseguradora Exemplo A",
    specialty: "Patrimonial",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Rafael Lima",
    email: "rafael@example.com",
    company: "Resseguradora Exemplo B",
    specialty: "Transportes",
  },
];
const template = {
  id: "00000000-0000-4000-8000-000000000003",
  label: "Oferta facultativa — patrimonial",
  version: 1,
  subject: "Oferta de resseguro · Renovação patrimonial",
  body: "Prezados,\n\nEncaminhamos para análise a oferta de resseguro referente à renovação patrimonial da Cedente Exemplo.\n\nOs termos e condições seguem no anexo. Ficamos à disposição para informações adicionais.\n\nAguardamos o retorno de sua equipe.",
  signature: "Ana Costa\nCorretora Exemplo\nana@example.com",
};
const demoDepartments = [
  {
    id: "00000000-0000-4000-8000-000000000010",
    name: "Treaty — Soluções Estruturadas",
    area: "Treaty",
  },
  {
    id: "00000000-0000-4000-8000-000000000011",
    name: "Property",
    area: "Facultativo",
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    name: "Financial Lines",
    area: "Facultativo",
  },
];
export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<{ tela?: string }>;
}) {
  const p = await searchParams;
  const screen = [
    "contatos",
    "modelos",
    "ofertas",
    "propostas",
    "comprovantes",
    "equipe",
  ].includes(p.tela ?? "")
    ? p.tela!
    : "propostas";
  return (
    <AppShell active="workspace">
      <Link
        href="/demonstracao/ativacao"
        className={buttonVariants({ variant: "outline" })}
      >
        Experimentar configuração da empresa
      </Link>
      <div className="brand-welcome flex flex-wrap items-center justify-between gap-5 rounded-2xl border p-5 sm:p-7">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-widest text-primary">
            Corretora Exemplo
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Seu portal de propostas e renovações
          </h1>
          <p className="mt-2 text-muted-foreground">
            Da preparação do negócio aos retornos do mercado, com prazos e
            histórico.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/cadastro" className={buttonVariants()}>
            Criar minha conta
          </Link>
        </div>
      </div>
      <Alert>
        <AlertTitle>Demonstração com dados fictícios</AlertTitle>
        <AlertDescription>
          Explore a organização das telas. Os formulários desta demonstração não
          gravam dados nem enviam e-mails.
        </AlertDescription>
      </Alert>
      <nav className="flex flex-wrap gap-2" aria-label="Telas da demonstração">
        {[
          "propostas",
          "contatos",
          "modelos",
          "ofertas",
          "comprovantes",
          "equipe",
        ].map((t) => (
          <Link
            key={t}
            href={`?tela=${t}`}
            aria-current={screen === t ? "page" : undefined}
            className={buttonVariants({
              variant: screen === t ? "default" : "outline",
              size: "sm",
            })}
          >
            {
              {
                contatos: "Contatos",
                modelos: "Modelos",
                ofertas: "Preparar oferta",
                propostas: "Propostas e renovações",
                comprovantes: "Comprovantes",
                equipe: "Setores e equipe",
              }[t]
            }
          </Link>
        ))}
      </nav>
      {screen === "propostas" && (
        <>
          <ProposalBoard
            proposals={demoProposalData(brazilToday())}
            org="demo"
            departments={portalDemoDepartments}
            lines={demoLines}
            today={brazilToday()}
            demo
          />
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de proposta</CardTitle>
              <CardDescription>
                Explore os campos de novo negócio ou renovação. A gravação está
                desativada na demonstração.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProposalForm
                org="demo"
                departments={portalDemoDepartments}
                lines={demoLines}
                previous={demoProposalData(brazilToday())}
                demo
              />
            </CardContent>
          </Card>
        </>
      )}
      {screen === "equipe" && (
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold">
              Uma empresa, vários setores
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cada pessoa entra com sua conta. Os dados ficam compartilhados na
              empresa, organizados por setor.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {demoDepartments.map((d) => (
              <Card key={d.id}>
                <CardHeader>
                  <Badge variant="secondary">{d.area}</Badge>
                  <CardTitle>{d.name}</CardTitle>
                  <CardDescription>Time da mesma empresa</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Contatos, modelos e ofertas compartilhados com os demais
                    setores.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Acessos da equipe</CardTitle>
              <CardDescription>
                Exemplo fictício de papéis e participação em setores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Setores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [
                      "Ana Costa",
                      "Responsável",
                      "Treaty, Property, Financial Lines",
                    ],
                    ["Marina Souza", "Colaborador", "Property"],
                    ["Rafael Lima", "Consulta", "Treaty, Financial Lines"],
                  ].map(([name, role, departments]) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{role}</Badge>
                      </TableCell>
                      <TableCell>{departments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}
      {screen === "ofertas" && (
        <section className="min-w-0">
          <h2 className="mb-5 text-xl font-semibold">Preparar oferta</h2>
          <OfferComposer
            departments={demoDepartments}
            org="demo"
            templates={[template]}
            contacts={demoContacts}
            initial={template.id}
            demo
          />
        </section>
      )}
      {screen === "contatos" && (
        <Card>
          <CardHeader>
            <CardTitle>Base de contatos</CardTitle>
            <CardDescription>
              Canais de subscrição mantidos pela sua equipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Resseguradora</TableHead>
                  <TableHead>Especialidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoContacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-muted-foreground">{c.email}</p>
                    </TableCell>
                    <TableCell>{c.company}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.specialty}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {screen === "modelos" && (
        <Card>
          <CardHeader>
            <CardTitle>{template.label}</CardTitle>
            <CardDescription>Versão 1 · {template.subject}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <p className="whitespace-pre-wrap text-sm">{template.body}</p>
            <p className="whitespace-pre-wrap border-t pt-4 text-sm text-muted-foreground">
              {template.signature}
            </p>
          </CardContent>
        </Card>
      )}
      {screen === "comprovantes" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Documentos da operação</CardTitle>
              <CardDescription>
                OF-2026-001 · Renovação patrimonial
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                ["Termos-da-oferta.pdf", "Anexo"],
                ["Resposta-exemplo.eml", "Resposta recebida"],
              ].map(([name, kind]) => (
                <div
                  key={name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <p className="font-medium">{name}</p>
                  <Badge variant="secondary">{kind}</Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Na sua conta, os originais ficam privados e disponíveis para
                download.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de respostas</CardTitle>
              <CardDescription>
                Classificações e comprovantes vinculados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Pedido de informação</Badge>
              <p className="mt-3 font-medium">
                Marina Souza · Resseguradora Exemplo A
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Solicitação de detalhamento dos valores em risco. Documento de
                resposta vinculado à operação.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
