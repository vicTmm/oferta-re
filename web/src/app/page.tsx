import Link from "next/link";
import {
  BriefcaseBusiness,
  RefreshCw,
  Send,
  MessagesSquare,
  ShieldCheck,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export default function Home() {
  return (
    <AppShell active="home">
      <section className="brand-welcome flex flex-col gap-6 rounded-2xl border p-6 sm:p-10">
        <Badge variant="secondary">PORTAL PARA CORRETORAS DE RESSEGURO</Badge>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Propostas e renovações, do preparo ao retorno do mercado.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Organize a carteira da sua corretora, as condições das ofertas, os
          prazos e os comprovantes em um ambiente compartilhado pela equipe.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/workspace" className={buttonVariants()}>
            Acessar meu ambiente
            <ArrowRight />
          </Link>
          <Link
            href="/demonstracao?tela=propostas"
            className={buttonVariants({ variant: "outline" })}
          >
            Experimentar o portal
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Login individual, ambiente por empresa e organização por setor.
        </p>
      </section>
      <section className="grid gap-x-8 gap-y-6 border-y py-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          [
            BriefcaseBusiness,
            "Carteira de propostas",
            "Cadastre o novo negócio antes de preparar e-mails. Organize cedente, risco, vigência, linha e próxima ação.",
          ],
          [
            RefreshCw,
            "Renovações com histórico",
            "Inicie um novo período ligado à proposta anterior, preservando suas condições e evidências.",
          ],
          [
            CalendarClock,
            "Prazos e andamento",
            "Visualize a carteira por etapa, filtre os setores e identifique próximas ações e prazos vencidos.",
          ],
          [
            Send,
            "Ofertas ao mercado",
            "Prepare o texto e os destinatários, revise as versões e registre o envio feito pelo Outlook.",
          ],
          [
            MessagesSquare,
            "Retornos e comprovantes",
            "Registre dúvidas, negativas e aceites com seus arquivos e acompanhe o histórico de cada processo.",
          ],
          [
            ShieldCheck,
            "Base de resseguradoras",
            "Consulte o cadastro público da SUSEP como apoio à seleção e organização do mercado.",
          ],
        ].map(([Icon, title, description]) => {
          const I = Icon as typeof BriefcaseBusiness;
          return (
            <article key={title as string} className="py-3">
              <I className="size-6 text-primary" />
              <h2 className="mt-4 font-semibold">{title as string}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description as string}
              </p>
            </article>
          );
        })}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6">
        <div>
          <h2 className="font-semibold">Comece pela sua operação</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure os setores, cadastre sua base autorizada e prepare a
            primeira proposta.
          </p>
        </div>
        <Link
          href="/cadastro"
          className={buttonVariants({ variant: "outline" })}
        >
          Criar minha conta
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Nesta versão, o envio acontece no Outlook e seu registro é manual. A
        conexão Microsoft 365 para rascunhos e captura de respostas está em
        planejamento.{" "}
        <Link className="text-primary underline" href="/resseguradoras">
          Consultar resseguradoras
        </Link>
        .
      </p>
    </AppShell>
  );
}
