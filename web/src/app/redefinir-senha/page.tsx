import Link from "next/link";
import { redirect } from "next/navigation";
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
import { serverSupabase } from "@/lib/supabase/server";
import { updatePassword } from "../entrar/actions";
export const dynamic = "force-dynamic";
export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const client = await serverSupabase();
  const user = client ? (await client.auth.getUser()).data.user : null;
  if (!user) redirect("/recuperar-senha?erro=link");
  const { erro } = await searchParams;
  return (
    <AppShell active="workspace">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1>Definir nova senha</h1>
          </CardTitle>
          <CardDescription>
            Use uma senha de 12 a 128 caracteres para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {erro && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível atualizar</AlertTitle>
              <AlertDescription>
                {erro === "dados"
                  ? "Use de 12 a 128 caracteres e confirme a mesma senha nos dois campos."
                  : "Escolha uma senha diferente da anterior. Se o link expirou, solicite outro."}
              </AlertDescription>
            </Alert>
          )}
          <form action={updatePassword} className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
              <Input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirmar nova senha
              </FieldLabel>
              <Input
                id="confirm-password"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
            </Field>
            <SubmitButton>Salvar nova senha</SubmitButton>
          </form>
          <Link
            href="/recuperar-senha"
            className="text-sm text-primary underline underline-offset-4"
          >
            Solicitar outro link
          </Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}
