import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AcceptInvitation } from "@/components/accept-invitation";
import { serverSupabase } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
export default async function Invitation() {
  const client = await serverSupabase();
  const user = client ? (await client.auth.getUser()).data.user : null;
  return (
    <AppShell active="workspace">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Convite para sua empresa</CardTitle>
          <CardDescription>
            Use sua conta individual com o e-mail informado pelo administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <AcceptInvitation />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Entre ou crie sua conta e confirme o e-mail. Depois, abra
                novamente o link do convite para acessar a empresa.
              </p>
              <Link href="/entrar" className="text-primary underline">
                Entrar
              </Link>
              <Link href="/cadastro" className="text-primary underline">
                Criar minha conta
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
