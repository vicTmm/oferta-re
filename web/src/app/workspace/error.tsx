"use client";
import { Button } from "@/components/ui/button";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-5 py-20">
      <h1 className="text-2xl font-semibold">
        Não foi possível carregar sua corretora
      </h1>
      <p className="text-muted-foreground">
        Confira sua conexão e tente novamente. Seus registros permanecem no
        banco.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
