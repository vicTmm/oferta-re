import Link from "next/link";
import { workspaceContext, checked } from "@/lib/workspace";
import { buttonVariants } from "./ui/button";
import { Badge } from "./ui/badge";
export async function CompanySetupCard({
  org,
}: {
  org: { id: string; name: string };
}) {
  const { client, canManage } = await workspaceContext(org.id);
  if (!canManage) return null;
  const profile = checked(
    await client
      .from("company_profiles")
      .select("status,payload")
      .eq("organization_id", org.id)
      .maybeSingle(),
  );
  const ready = profile?.status === "complete";
  return (
    <section className="flex flex-col justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center">
      <div>
        <Badge variant={ready ? "success" : "secondary"}>
          {ready ? "Configuração concluída" : "Configuração inicial"}
        </Badge>
        <h2 className="mt-3 font-medium">
          {ready
            ? "Mantenha os dados da empresa atualizados"
            : "Prepare o ambiente da sua empresa"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Revise o responsável, áreas, setores e linhas de negócio."
            : profile
              ? `Retome na etapa ${Number(profile.payload.step) + 1} de 4. Seu progresso foi salvo.`
              : "Defina o responsável e a estrutura da operação. Os detalhes podem ficar para depois."}
        </p>
      </div>
      <Link
        href={`/workspace/ativacao?org=${org.id}`}
        className={buttonVariants({ variant: "outline" })}
      >
        {ready
          ? "Editar configuração"
          : profile
            ? "Retomar configuração"
            : "Configurar empresa"}
      </Link>
    </section>
  );
}
