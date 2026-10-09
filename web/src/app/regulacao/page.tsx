import { createClient } from "@supabase/supabase-js";
import { AppShell } from "@/components/app-shell";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabaseConfig } from "@/lib/supabase/config";
export const dynamic = "force-dynamic";
const labels: Record<string, string> = {
  proposal: "Proposta",
  published: "Publicada",
  in_force: "Em vigor",
  revoked: "Revogada",
};
export default async function Regulation() {
  const config = supabaseConfig();
  const result = config
    ? await createClient(config.url, config.key, {
        auth: { persistSession: false },
      })
        .from("regulatory_updates")
        .select(
          "id,title,summary,source_url,legal_status,penalty_reference,reviewed_at",
        )
        .order("reviewed_at", { ascending: false })
    : null;
  return (
    <AppShell active="regulation">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Atualizações regulatórias
        </h1>
        <p className="text-sm text-muted-foreground">
          Normas, propostas e referências de multas, com fonte e data de
          revisão.
        </p>
      </div>
      {result?.error ? (
        <Alert>
          <AlertTitle>Atualizações indisponíveis</AlertTitle>
          <AlertDescription>Tente novamente mais tarde.</AlertDescription>
        </Alert>
      ) : !result?.data?.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nenhuma atualização revisada publicada</EmptyTitle>
            <EmptyDescription>
              Novas referências aparecerão aqui após curadoria. Consulte as
              fontes oficiais para informações atuais.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        result.data.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <Badge variant="outline">{labels[item.legal_status]}</Badge>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>
                Revisado em{" "}
                {new Date(item.reviewed_at).toLocaleDateString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p>{item.summary}</p>
              {item.penalty_reference && (
                <p className="text-sm text-muted-foreground">
                  {item.penalty_reference}
                </p>
              )}
              <a
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline underline-offset-4"
              >
                Ler fonte oficial
              </a>
            </CardContent>
          </Card>
        ))
      )}
    </AppShell>
  );
}
