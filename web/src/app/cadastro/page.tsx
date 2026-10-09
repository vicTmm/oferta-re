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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabaseConfig } from "@/lib/supabase/config";
import { signUp } from "../entrar/actions";
export const dynamic = "force-dynamic";
export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; confirmacao?: string }>;
}) {
  const params = await searchParams;
  const configured = !!supabaseConfig();
  return (
    <AppShell active="workspace">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar minha conta</CardTitle>
          <CardDescription>
            Após entrar, você poderá criar o ambiente privado da empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {params.confirmacao && (
            <Alert>
              <AlertTitle>Confira seu e-mail</AlertTitle>
              <AlertDescription>
                Se o cadastro foi aceito, você receberá um link para confirmar o
                acesso. Depois, entre com sua senha.
              </AlertDescription>
            </Alert>
          )}
          {params.erro && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível concluir o cadastro</AlertTitle>
              <AlertDescription>
                Confira os dados e tente novamente.
              </AlertDescription>
            </Alert>
          )}
          {!configured && (
            <Alert>
              <AlertTitle>Cadastro em configuração</AlertTitle>
              <AlertDescription>
                A área privada será liberada após conectar o projeto.
              </AlertDescription>
            </Alert>
          )}
          <form action={signUp} className="flex flex-col gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  disabled={!configured}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={12}
                  autoComplete="new-password"
                  disabled={!configured}
                  required
                />
                <FieldDescription>
                  Use pelo menos 12 caracteres.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={!configured}>
              Criar conta
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link className="text-sm underline underline-offset-4" href="/entrar">
            Já tenho uma conta
          </Link>
        </CardFooter>
      </Card>
    </AppShell>
  );
}
