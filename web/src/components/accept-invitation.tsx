"use client";
import { useEffect, useState } from "react";
import { acceptInvitation } from "@/app/convite/actions";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function AcceptInvitation() {
  const [token, setToken] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (/^[0-9a-f]{64}$/.test(hash)) setToken(hash);
  }, []);
  return (
    <form
      action={async (f) => {
        setPending(true);
        try {
          const result = await acceptInvitation(f);
          setError(result.error ?? "");
        } catch {
          setError("Não foi possível conferir o convite. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
      className="flex flex-col gap-5"
    >
      <Field>
        <FieldLabel htmlFor="token">Código do convite</FieldLabel>
        <Input
          id="token"
          name="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          minLength={64}
          maxLength={64}
          required
          autoComplete="off"
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Conferindo…" : "Entrar na empresa"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
