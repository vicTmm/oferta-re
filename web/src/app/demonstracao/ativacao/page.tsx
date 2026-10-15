import { AppShell } from "@/components/app-shell";
import { ActivationWizard } from "@/components/activation-wizard";
import { emptySetup } from "@/lib/onboarding";
export default function ActivationDemo() {
  return (
    <AppShell active="workspace" demo>
      <ActivationWizard
        initial={emptySetup(
          "Corretora Exemplo",
          "ana@example.com",
          "Ana Costa",
        )}
        revision={0}
        completed={false}
        demo
      />
    </AppShell>
  );
}
