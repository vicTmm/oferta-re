import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  Users,
  FileText,
  Send,
  Paperclip,
  LayoutDashboard,
} from "lucide-react";
import { buttonVariants } from "./ui/button";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { cn } from "@/lib/utils";
const tabs = [
  ["", "Visão geral", LayoutDashboard],
  ["/contatos", "Contatos", Users],
  ["/modelos", "Modelos", FileText],
  ["/propostas", "Propostas e renovações", Send],
  ["/comprovantes", "Comprovantes", Paperclip],
  ["/equipe", "Setores e equipe", Users],
  ["/ativacao", "Configuração", FileText],
] as const;
export function WorkspaceNav({
  org,
  active,
  canManage = false,
}: {
  org: { id: string; name: string };
  active: string;
  canManage?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          Ambiente da empresa
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{org.name}</p>
      </div>
      <nav aria-label="Área da corretora" className="flex flex-wrap gap-2">
        {tabs
          .filter(([path]) => path !== "/ativacao" || canManage)
          .map(([path, label, Icon]) => (
            <Link
              key={path}
              href={`/workspace${path}?org=${org.id}`}
              aria-current={active === path ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: active === path ? "default" : "outline",
                  size: "sm",
                }),
              )}
            >
              <Icon data-icon="inline-start" />
              {label}
            </Link>
          ))}
      </nav>
    </div>
  );
}
export function TextField({
  label,
  name,
  multiline = false,
  ...props
}: {
  label: string;
  name: string;
  multiline?: boolean;
  required?: boolean;
  defaultValue?: string;
  maxLength?: number;
  type?: string;
  placeholder?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      {multiline ? (
        <Textarea id={name} name={name} rows={6} {...props} />
      ) : (
        <Input id={name} name={name} {...props} />
      )}
    </Field>
  );
}
export function Feedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível salvar</AlertTitle>
          <AlertDescription>
            {error === "conflito"
              ? "Outra pessoa atualizou a proposta. Recarregue a página antes de editar novamente."
              : error === "comprovante"
                ? "Conclua o upload do arquivo da resposta antes de registrar sua classificação."
                : error === "upload"
                  ? "O arquivo não foi recebido. Os metadados foram preservados; envie novamente para o mesmo registro."
                  : error === "validacao"
                    ? "Confira os campos obrigatórios, os limites e os destinatários selecionados."
                    : "Confira duplicatas e permissões da conta. Tente novamente."}
          </AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-success/20 bg-success-soft text-success">
          <CheckCircle2 />
          <AlertTitle>Registro salvo</AlertTitle>
          <AlertDescription>
            As informações estão disponíveis para a sua corretora.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
