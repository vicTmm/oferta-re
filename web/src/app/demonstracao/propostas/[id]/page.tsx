import { AppShell } from "@/components/app-shell";
import { MockWorkspace } from "@/components/mock-workspace";
export default async function DemoProposal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell active="proposals" demo>
      <MockWorkspace proposalId={id} />
    </AppShell>
  );
}
