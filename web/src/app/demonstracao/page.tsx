import { AppShell } from "@/components/app-shell";
import { MockWorkspace } from "@/components/mock-workspace";
export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<{ tela?: string; renovar?: string }>;
}) {
  const params = await searchParams;
  const screen = [
    "propostas",
    "contatos",
    "modelos",
    "ofertas",
    "comprovantes",
    "equipe",
  ].includes(params.tela ?? "")
    ? params.tela
    : "propostas";
  return (
    <AppShell active="workspace" demo>
      <MockWorkspace screen={screen} renewId={params.renovar} />
    </AppShell>
  );
}
