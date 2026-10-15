import Link from "next/link";
import { workspaceContext, checked } from "@/lib/workspace";
import {
  isClosed,
  isOverdue,
  expiringCoverage,
  brazilToday,
  type Proposal,
} from "@/lib/proposals";
import { buttonVariants } from "./ui/button";
export async function CompanyPortfolio({
  org,
}: {
  org: { id: string; name: string };
}) {
  const { client } = await workspaceContext(org.id);
  const proposals = (checked(
    await client
      .from("operations")
      .select("id,business_kind,stage,due_date,coverage_end")
      .eq("organization_id", org.id),
  ) ?? []) as Proposal[];
  const today = brazilToday();
  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-y-5 border-y py-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Propostas ativas",
            proposals.filter((p) => !isClosed(p.stage)).length,
          ],
          [
            "Renovações ativas",
            proposals.filter(
              (p) => p.business_kind === "renewal" && !isClosed(p.stage),
            ).length,
          ],
          [
            "Vigências a vencer · 30 dias",
            proposals.filter((p) => expiringCoverage(p, today)).length,
          ],
          [
            "Prazos vencidos",
            proposals.filter((p) => isOverdue(p, today)).length,
          ],
        ].map(([label, total]) => (
          <div key={label} className="border-l-2 pl-4 first:border-primary">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{total}</p>
          </div>
        ))}
      </div>
      <Link
        href={`/workspace/propostas?org=${org.id}`}
        className={buttonVariants()}
      >
        Abrir carteira de propostas e renovações
      </Link>
    </section>
  );
}
