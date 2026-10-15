// Destinos fixos: links de autenticação nunca redirecionam para outro domínio.
export function authDestination(next: string | null, recovery = false) {
  return recovery || next === "/redefinir-senha"
    ? "/redefinir-senha"
    : "/workspace";
}
