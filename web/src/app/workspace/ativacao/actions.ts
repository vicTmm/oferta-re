"use server";
import { revalidatePath } from "next/cache";
import { workspaceContext } from "@/lib/workspace";
import { validateSetup, type SetupResult } from "@/lib/onboarding";
export async function saveActivation(
  orgId: string,
  raw: unknown,
  complete: boolean,
  revision: number,
): Promise<SetupResult> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orgId,
    ) ||
    typeof complete !== "boolean" ||
    !Number.isSafeInteger(revision) ||
    revision < 0
  )
    return { error: "Solicitação inválida." };
  const { client, org, canManage } = await workspaceContext(orgId);
  if (!canManage)
    return {
      error:
        "Somente o responsável e administradores podem configurar a empresa.",
    };
  const validated = validateSetup(raw, complete);
  if (validated.error) return { error: validated.error };
  const { data, error } = await client.rpc("save_company_onboarding", {
    p_org: org.id,
    p_payload: validated.payload,
    p_complete: complete,
    p_revision: revision,
  });
  if (error)
    return {
      error: error.message.includes("Recarregue")
        ? "Outra pessoa atualizou a configuração. Recarregue a página antes de editar novamente."
        : "Não foi possível salvar. Confira os setores e as permissões e tente novamente.",
    };
  revalidatePath("/workspace", "layout");
  return data as SetupResult;
}
