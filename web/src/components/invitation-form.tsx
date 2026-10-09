"use client";
import { HelpTooltip, TooltipHint } from "./tooltip-hint";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteMember } from "@/app/workspace/equipe/actions";
import { FieldGroup, Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function InvitationForm({
  org,
  departments,
  owner,
}: {
  org: string;
  departments: { id: string; name: string }[];
  owner: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  return (
    <form
      action={async (data) => {
        setBusy(true);
        setUrl("");
        setError("");
        setCopied(false);
        try {
          const result = await inviteMember(data);
          setUrl(result.url ?? "");
          setError(result.error ?? "");
          router.refresh();
        } catch {
          setError("Não foi possível criar o convite.");
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="org" value={org} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="invite-email">E-mail do colega</FieldLabel>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            maxLength={254}
          />
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor="invite-role">Permissão na empresa</FieldLabel>
            <HelpTooltip
              label="Permissão na empresa"
              content="Colaboradores preparam e editam registros; usuários de consulta apenas leem. Administradores também configuram a empresa e gerenciam a equipe. O papel vale para todos os setores da empresa."
            />
          </div>
          <select
            id="invite-role"
            name="role"
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="member">Colaborador — prepara e edita</option>
            <option value="viewer">Consulta — somente leitura</option>
            {owner && (
              <option value="admin">Administrador — gerencia a equipe</option>
            )}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="invite-department">
            Setor inicial (opcional)
          </FieldLabel>
          <select
            id="invite-department"
            name="department_id"
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="">Sem setor definido</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      </FieldGroup>
      <TooltipHint content="Gera um link válido por 7 dias para o e-mail informado. Você compartilha o link; nenhum e-mail é enviado automaticamente.">
        <Button type="submit" disabled={busy}>
          {busy ? "Criando…" : "Criar convite"}
        </Button>
      </TooltipHint>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {url && (
        <div className="flex flex-col gap-3 rounded-xl border bg-accent p-4">
          <p className="text-sm">
            Compartilhe este link com o colega convidado. Ele expira em 7 dias e
            exige o mesmo e-mail confirmado.
          </p>
          <Input aria-label="Link do convite" value={url} readOnly />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              } catch {
                setError("Selecione e copie o link manualmente.");
              }
            }}
          >
            {copied ? "Copiado" : "Copiar link"}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Nenhum e-mail é enviado automaticamente. O convite não permite acesso a
        outras empresas.
      </p>
    </form>
  );
}
