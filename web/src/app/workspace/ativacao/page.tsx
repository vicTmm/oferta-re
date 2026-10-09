import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { WorkspaceNav } from "@/components/workspace-ui";
import { ActivationWizard } from "@/components/activation-wizard";
import { workspaceContext, checked } from "@/lib/workspace";
import { emptySetup, type CompanySetup } from "@/lib/onboarding";
import { saveActivation } from "./actions";
export default async function Activation({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org, client, user, canManage, departments } = await workspaceContext(
    (await searchParams).org,
  );
  if (!canManage) redirect(`/workspace?org=${org.id}`);
  const [profileResult, linesResult, linksResult] = await Promise.all([
    client
      .from("company_profiles")
      .select("payload,revision,status")
      .eq("organization_id", org.id)
      .maybeSingle(),
    client
      .from("business_lines")
      .select("id,name")
      .eq("organization_id", org.id),
    client
      .from("department_business_lines")
      .select("department_id,business_line_id")
      .eq("organization_id", org.id),
  ]);
  const profile = checked(profileResult),
    lines = checked(linesResult) ?? [],
    links = checked(linksResult) ?? [];
  const initial: CompanySetup = {
    ...emptySetup(
      org.name,
      user.email ?? "",
      user.user_metadata?.full_name ?? "",
    ),
    ...((profile?.payload as Partial<CompanySetup>) ?? {}),
    name: org.name,
  };
  // A estrutura atual prevalece sobre o rascunho para preservar mudanças feitas na tela de equipe.
  initial.sectors = departments.map((d) => ({
    ...d,
    area: d.area as "treaty" | "facultative" | "other",
    lines: links
      .filter((l) => l.department_id === d.id)
      .map((l) => lines.find((line) => line.id === l.business_line_id)?.name)
      .filter((name): name is string => !!name),
  }));
  return (
    <AppShell active="workspace">
      <WorkspaceNav org={org} active="/ativacao" canManage />
      <ActivationWizard
        initial={initial}
        revision={profile?.revision ?? 0}
        completed={profile?.status === "complete"}
        orgId={org.id}
        save={saveActivation.bind(null, org.id)}
      />
    </AppShell>
  );
}
