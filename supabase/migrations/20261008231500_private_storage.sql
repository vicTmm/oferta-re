insert into storage.buckets(id, name, public, file_size_limit)
values('operation-documents', 'operation-documents', false, 26214400);

-- Arquivos só podem ser enviados após metadados autorizados. Não se aceita um
-- UUID de organização no caminho como única prova de acesso/vínculo.
create function public.can_access_document(p_path text, p_write boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.documents d
    where d.storage_path = p_path and public.has_org_role(d.organization_id,
      case when p_write then array['owner', 'admin', 'member'] else array['owner', 'admin', 'member', 'viewer'] end));
$$;
revoke all on function public.can_access_document(text, boolean) from public, anon;
grant execute on function public.can_access_document(text, boolean) to authenticated;
create policy document_objects_read on storage.objects for select to authenticated
using (bucket_id = 'operation-documents' and public.can_access_document(name));
create policy document_objects_insert on storage.objects for insert to authenticated
with check (bucket_id = 'operation-documents' and public.can_access_document(name, true));
-- Sem UPDATE/DELETE no bucket: originais não são sobrescritos via cliente.
