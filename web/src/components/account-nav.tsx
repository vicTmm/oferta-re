import Link from "next/link";
import { LogIn, ArrowUpRight } from "lucide-react";
import { serverSupabase } from "@/lib/supabase/server";
import { buttonVariants } from "./ui/button";
export async function AccountNav() {
  const client = await serverSupabase();
  const user = client ? (await client.auth.getUser()).data.user : null;
  return (
    <Link
      href={user ? "/workspace" : "/entrar"}
      className={buttonVariants({
        variant: user ? "outline" : "default",
        size: "sm",
      })}
    >
      {user ? "Meu ambiente" : "Entrar"}
      {user ? (
        <ArrowUpRight data-icon="inline-end" />
      ) : (
        <LogIn data-icon="inline-end" />
      )}
    </Link>
  );
}
