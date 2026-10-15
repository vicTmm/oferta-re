import Link from "next/link";
import { TooltipProvider } from "./ui/tooltip";
import { TooltipHint } from "./tooltip-hint";
import { AccountNav } from "./account-nav";
import { Mascot } from "@/components/mascot";
import { Building2, Library, Scale, BriefcaseBusiness } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function AppShell({
  children,
  active = "catalog",
  demo = false,
}: {
  children: React.ReactNode;
  demo?: boolean;
  active?: "home" | "catalog" | "regulation" | "workspace" | "proposals";
}) {
  const items = [
    {
      href: demo ? "/demonstracao?tela=propostas" : "/workspace/propostas",
      label: "Propostas e renovações",
      icon: BriefcaseBusiness,
      key: "proposals",
    },
    {
      href: "/resseguradoras",
      label: "Resseguradoras",
      icon: Building2,
      key: "catalog",
    },
    {
      href: "/regulacao",
      label: "Atualizações regulatórias",
      icon: Scale,
      key: "regulation",
    },
    {
      href: demo ? "/demonstracao" : "/workspace",
      label: "Meu ambiente",
      icon: Library,
      key: "workspace",
    },
  ];
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <a href="#content" className="sr-only focus:not-sr-only">
          Ir para o conteúdo
        </a>
        <aside
          className="fixed inset-y-0 left-0 hidden w-20 flex-col items-center gap-8 border-r bg-card py-6 md:flex"
          aria-label="Navegação principal"
        >
          <TooltipHint content="Oferta Re · Início" side="right">
            <Link
              href="/"
              aria-label="Oferta Re, início"
              className="flex size-12 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mascot className="w-11" decorative eager />
            </Link>
          </TooltipHint>
          <nav className="flex flex-col gap-3">
            {items.map((item) => (
              <TooltipHint key={item.key} content={item.label} side="right">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active === item.key ? "page" : undefined}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active === item.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                </Link>
              </TooltipHint>
            ))}
          </nav>
          <span className="mt-auto text-xs font-medium text-muted-foreground [writing-mode:vertical-rl]">
            OFERTA RE
          </span>
        </aside>
        <div className="md:pl-20">
          <header className="flex h-20 items-center justify-between border-b bg-card px-5 md:px-10">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-semibold sm:text-lg tracking-tight"
            >
              <Mascot className="w-8 md:hidden" decorative />
              <span>
                Oferta <span className="text-primary"> Re</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2" aria-label="Conta">
              <Link
                href="/demonstracao"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                Conhecer o portal
              </Link>
              <Link
                href="/regulacao"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                Regulação
              </Link>
              <AccountNav />
            </nav>
          </header>
          <main
            id="content"
            className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 md:px-10 md:py-10"
          >
            {children}
          </main>
          <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 pb-8 text-xs text-muted-foreground md:px-10">
            <span>
              Oferta Re · Portal de propostas e renovações de resseguro
            </span>
            <Link className="underline underline-offset-4" href="/regulacao">
              Atualizações regulatórias
            </Link>
            <a
              className="underline underline-offset-4"
              href="https://www2.susep.gov.br/menuatendimento/procura_2011.asp"
              target="_blank"
              rel="noreferrer"
            >
              Consultar fonte SUSEP
            </a>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
