import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";
import { supabaseConfig } from "@/lib/supabase/config";
import { requestPasswordReset } from "../entrar/actions";
export const dynamic = "force-dynamic";
const messages: Record<string, string> = {
  configuracao: "A recuperação de acesso ainda não está configurada.",
  dados: "Informe um e-mail válido.",
  limite: "Aguarde alguns minutos antes de solicitar outro link.",
  envio: "Não foi possível enviar o link. Tente novamente mais tarde.",
  link: "O link expirou ou já foi utilizado. Solicite um novo link.",
};
export default async function RecoverPassword({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; enviado?: string }>;
}) {
  const { erro, enviado } = await searchParams;
  const configured = !!supabaseConfig();
  return (
    <AppShell active="workspace">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1>Recuperar acesso</h1>
          </CardTitle>
          <CardDescription>
            Informe o e-mail usado no Oferta Re para receber um link de
            recuperação.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {enviado && (
            <Alert>
              <AlertTitle>Confira seu e-mail</AlertTitle>
              <AlertDescription>
                Se houver uma conta com esse e-mail, você receberá um link para
                definir uma nova senha. Confira também a pasta de spam. Abra o
                link neste navegador.
              </AlertDescription>
            </Alert>
          )}
          {erro && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível concluir</AlertTitle>
              <AlertDescription>
                {messages[erro] ?? messages.envio}
              </AlertDescription>
            </Alert>
          )}
          <form action={requestPasswordReset} className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="recovery-email">E-mail da conta</FieldLabel>
              <Input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                disabled={!configured}
              />
            </Field>
            <SubmitButton disabled={!configured}>
              Enviar link de recuperação
            </SubmitButton>
          </form>
          <Link
            href="/entrar"
            className="text-sm text-primary underline underline-offset-4"
          >
            Voltar para entrar
          </Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}
