-- Função interna de event trigger: clientes da API não devem executá-la.
-- Alguns ambientes locais não têm o helper instalado pelo Supabase hospedado.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
