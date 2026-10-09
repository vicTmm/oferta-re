import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabaseConfig } from "@/lib/supabase/config";
import { signIn } from "./actions";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const configured = !!supabaseConfig();
  const { erro } = await searchParams;
  return (
    <AppShell active="workspace">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar no Oferta Re</CardTitle>
          <CardDescription>
            Use sua conta individual para acessar o ambiente da empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {!configured && (
            <Alert>
              <AlertTitle>Área privada em configuração</AlertTitle>
              <AlertDescription>
                A consulta pública já está disponível. O acesso da equipe será
                liberado após conectar o projeto.
              </AlertDescription>
            </Alert>
          )}
          {erro && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível entrar</AlertTitle>
              <AlertDescription>
                Confira seus dados e tente novamente.
              </AlertDescription>
            </Alert>
          )}
          <form action={signIn} className="flex flex-col gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  disabled={!configured}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={!configured}
                />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={!configured}>
              Entrar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-3">
          <Link className="text-sm underline underline-offset-4" href="/">
            Voltar à consulta pública
          </Link>
          <Link
            className="text-sm underline underline-offset-4"
            href="/cadastro"
          >
            Criar conta
          </Link>
        </CardFooter>
      </Card>
    </AppShell>
  );
}
