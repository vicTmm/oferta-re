-- Oferta Re: catálogo público separado dos dados privados por organização.
create table public.collection_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  status text not null check (status in ('validated', 'failed')),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  source_url text not null,
  snapshot_hash text,
  code_hash text,
  counts jsonb not null default '{}'::jsonb,
  error_summary text,
  check (finished_at >= started_at)
);
create table public.reinsurer_snapshots (
  run_id uuid not null references public.collection_runs(id),
  monitoring_key text not null,
  record jsonb not null check (jsonb_typeof(record) = 'object'),
  primary key (run_id, monitoring_key)
);
create index collection_runs_latest on public.collection_runs (finished_at desc) where status = 'validated';
create view public.latest_public_reinsurers with (security_invoker = true) as
select s.monitoring_key, s.record,
  s.record ->> 'nome' as name,
  s.record ->> 'cnpj' as cnpj,
  s.record ->> 'tipo' as category,
  r.run_key, r.finished_at as collected_at
from public.reinsurer_snapshots s
join public.collection_runs r on r.id = s.run_id
where r.id = (select id from public.collection_runs where status = 'validated' order by finished_at desc, run_key desc limit 1);
alter table public.collection_runs enable row level security;
alter table public.reinsurer_snapshots enable row level security;
create policy public_runs_read on public.collection_runs for select to anon, authenticated using (true);
create policy public_snapshots_read on public.reinsurer_snapshots for select to anon, authenticated using (true);
grant select on public.collection_runs, public.reinsurer_snapshots, public.latest_public_reinsurers to anon, authenticated;
revoke insert, update, delete on public.collection_runs, public.reinsurer_snapshots from anon, authenticated;

-- Uma chamada publica snapshot + estado de execução na mesma transação.
create function public.publish_susep_collection(
  p_run_key text, p_started_at timestamptz, p_finished_at timestamptz,
  p_source_url text, p_snapshot_hash text, p_code_hash text, p_rows jsonb,
  p_max_category_drop numeric default 0.10
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_old public.collection_runs%rowtype;
  v_existing public.collection_runs%rowtype;
  v_counts jsonb;
  v_category text;
  v_count integer;
  v_previous_count integer;
begin
  if p_source_url <> 'https://www2.susep.gov.br/menuatendimento/procura_2011.asp' then
    raise exception 'Origem SUSEP inesperada';
  end if;
  if p_max_category_drop < 0 or p_max_category_drop >= 1 or p_max_category_drop is null then
    raise exception 'Limiar de queda inválido';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'Snapshot vazio ou inválido';
  end if;
  if p_snapshot_hash is null or p_snapshot_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Hash de snapshot inválido';
  end if;
  -- Serializa publicação; evita dois escritores validarem contra a mesma base antiga.
  perform pg_advisory_xact_lock(781237541);
  select * into v_existing from public.collection_runs where run_key = p_run_key;
  if found then
    if v_existing.status = 'validated' and v_existing.snapshot_hash = p_snapshot_hash then
      return v_existing.id;
    end if;
    raise exception 'Chave de execução já utilizada com conteúdo diferente';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_rows) r
    where jsonb_typeof(r) <> 'object'
      or nullif(btrim(r ->> 'chave_monitoramento'), '') is null
      or nullif(btrim(r ->> 'nome'), '') is null
      or (nullif(btrim(r ->> 'entcodigo'), '') is null and nullif(btrim(r ->> 'cnpj'), '') is null)
      or coalesce(r ->> 'tipo', '') not in ('Resseguradora Local', 'Resseguradora Admitida', 'Resseguradora Eventual')
  ) then raise exception 'Registro sem identificação ou categoria válida'; end if;
  if (select count(distinct r ->> 'chave_monitoramento') from jsonb_array_elements(p_rows) r) <> jsonb_array_length(p_rows) then
    raise exception 'Chaves duplicadas';
  end if;
  select jsonb_object_agg(category, quantity) into v_counts from (
    select r ->> 'tipo' category, count(*) quantity from jsonb_array_elements(p_rows) r group by 1
  ) counts;
  select * into v_old from public.collection_runs where status = 'validated' order by finished_at desc, run_key desc limit 1;
  if found and p_finished_at <= v_old.finished_at then raise exception 'Snapshot fora de ordem cronológica'; end if;
  foreach v_category in array array['Resseguradora Local', 'Resseguradora Admitida', 'Resseguradora Eventual'] loop
    v_count := coalesce((v_counts ->> v_category)::integer, 0);
    if v_count = 0 then raise exception 'Categoria ausente: %', v_category; end if;
    v_previous_count := coalesce((v_old.counts ->> v_category)::integer, 0);
    if v_previous_count > 0 and (v_previous_count - v_count)::numeric / v_previous_count > p_max_category_drop then
      raise exception 'Queda suspeita em %', v_category;
    end if;
  end loop;
  insert into public.collection_runs (run_key, status, started_at, finished_at, source_url, snapshot_hash, code_hash, counts)
  values (p_run_key, 'validated', p_started_at, p_finished_at, p_source_url, p_snapshot_hash, p_code_hash, v_counts)
  returning id into v_id;
  insert into public.reinsurer_snapshots (run_id, monitoring_key, record)
  select v_id, r ->> 'chave_monitoramento', r from jsonb_array_elements(p_rows) r;
  return v_id;
end $$;
revoke all on function public.publish_susep_collection(text, timestamptz, timestamptz, text, text, text, jsonb, numeric) from public, anon, authenticated;
grant execute on function public.publish_susep_collection(text, timestamptz, timestamptz, text, text, text, jsonb, numeric) to service_role;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user on public.organization_members (user_id, organization_id);
create function public.has_org_role(p_org uuid, p_roles text[] default array['owner', 'admin', 'member', 'viewer'])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organization_members m
    where m.organization_id = p_org and m.user_id = (select auth.uid()) and m.role = any(p_roles));
$$;
revoke all on function public.has_org_role(uuid, text[]) from public, anon;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
create policy organizations_read on public.organizations for select to authenticated using (public.has_org_role(id));
create policy organizations_update on public.organizations for update to authenticated
using (public.has_org_role(id, array['owner', 'admin'])) with check (public.has_org_role(id, array['owner', 'admin']));
create policy members_read on public.organization_members for select to authenticated using (public.has_org_role(organization_id));
revoke all on public.organizations, public.organization_members from anon, authenticated;
grant select on public.organizations, public.organization_members to authenticated;
grant update (name) on public.organizations to authenticated;
-- Participações/papéis não são graváveis pelo cliente. Convites entram em migração posterior.
create function public.create_organization(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Autenticação necessária'; end if;
  if exists(select 1 from public.organization_members where user_id = v_user and role = 'owner') then
    raise exception 'Usuário já possui uma organização; criação adicional requer administração';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  -- Conferir novamente após o lock evita criação duplicada concorrente.
  if exists(select 1 from public.organization_members where user_id = v_user and role = 'owner') then
    raise exception 'Usuário já possui uma organização';
  end if;
  insert into public.organizations(name, created_by) values (btrim(p_name), v_user) returning id into v_id;
  insert into public.organization_members(organization_id, user_id, role) values(v_id, v_user, 'owner');
  return v_id;
end $$;
revoke all on function public.create_organization(text) from public, anon;
grant execute on function public.create_organization(text) to authenticated;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  reinsurer_key text not null,
  name text not null check (btrim(name) <> ''),
  email text not null check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  specialties text[] not null default '{}',
  source_note text,
  verified_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, reinsurer_key, email)
);
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (btrim(name) <> ''),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);
create table public.email_template_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  template_id uuid not null,
  version integer not null check (version > 0),
  subject text not null,
  body text not null,
  signature text not null default '',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (template_id, version),
  foreign key (organization_id, template_id) references public.email_templates(organization_id, id)
);
create table public.operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  reference text not null,
  title text not null check (btrim(title) <> ''),
  cedent_name text not null,
  contract_reference text,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'cancelled')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, reference)
);
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  operation_id uuid not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, operation_id) references public.operations(organization_id, id)
);
create table public.offer_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  offer_id uuid not null,
  template_version_id uuid,
  version integer not null check (version > 0),
  subject text not null,
  body text not null,
  signature text not null default '',
  terms jsonb not null default '{}',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (offer_id, version),
  foreign key (organization_id, offer_id) references public.offers(organization_id, id),
  foreign key (organization_id, template_version_id) references public.email_template_versions(organization_id, id)
);
create table public.offer_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  offer_version_id uuid not null,
  contact_id uuid,
  reinsurer_key text not null,
  destination_email text not null,
  destination_name text not null,
  status text not null default 'prepared' check (status in ('prepared', 'draft_created', 'sent_confirmed', 'response_recorded')),
  outlook_draft_id text,
  sent_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (offer_version_id, destination_email),
  foreign key (organization_id, offer_version_id) references public.offer_versions(organization_id, id),
  foreign key (organization_id, contact_id) references public.contacts(organization_id, id)
);
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  operation_id uuid not null,
  recipient_id uuid,
  kind text not null check (kind in ('attachment', 'sending_evidence', 'response', 'other')),
  original_name text not null,
  storage_path text not null unique,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  media_type text not null,
  message_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, operation_id) references public.operations(organization_id, id),
  foreign key (organization_id, recipient_id) references public.offer_recipients(organization_id, id),
  check (storage_path = organization_id::text || '/' || operation_id::text || '/' || id::text)
);
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  recipient_id uuid not null,
  document_id uuid,
  classification text not null check (classification in ('information_request', 'declined', 'accepted_partial', 'accepted_total', 'other', 'unconfirmed')),
  note text,
  responded_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, recipient_id) references public.offer_recipients(organization_id, id),
  foreign key (organization_id, document_id) references public.documents(organization_id, id)
);
create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id),
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  record_id uuid not null,
  action text not null,
  created_at timestamptz not null default now()
);
alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon, authenticated;
grant select on public.audit_events to authenticated;
create policy audit_read on public.audit_events for select to authenticated using(public.has_org_role(organization_id));

create function public.protect_private_record() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.organization_id <> old.organization_id
    or new.created_by <> old.created_by or new.created_at <> old.created_at then
    raise exception 'Identidade, organização e autoria são imutáveis';
  end if;
  new.updated_at := now();
  return new;
end $$;
create function public.audit_private_record() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events(organization_id, actor_id, table_name, record_id, action)
  values (new.organization_id, auth.uid(), tg_table_name, new.id, tg_op);
  return new;
end $$;
revoke all on function public.protect_private_record(), public.audit_private_record() from public, anon, authenticated;

do $$
declare v_table text; v_immutable boolean;
begin
  foreach v_table in array array['contacts', 'email_templates', 'email_template_versions', 'operations', 'offers', 'offer_versions', 'offer_recipients', 'documents', 'responses'] loop
    v_immutable := v_table in ('email_template_versions', 'offer_versions', 'documents');
    execute format('alter table public.%I enable row level security', v_table);
    execute format('revoke all on public.%I from anon, authenticated', v_table);
    execute format('grant select, insert on public.%I to authenticated', v_table);
    execute format('create policy tenant_read on public.%I for select to authenticated using (public.has_org_role(organization_id))', v_table);
    execute format('create policy tenant_insert on public.%I for insert to authenticated with check (public.has_org_role(organization_id, array[''owner'', ''admin'', ''member'']) and created_by = (select auth.uid()))', v_table);
    if not v_immutable then
      execute format('grant update on public.%I to authenticated', v_table);
      execute format('create policy tenant_update on public.%I for update to authenticated using (public.has_org_role(organization_id, array[''owner'', ''admin'', ''member''])) with check (public.has_org_role(organization_id, array[''owner'', ''admin'', ''member'']))', v_table);
    end if;
    execute format('create index on public.%I (organization_id)', v_table);
    execute format('create trigger protect_record before update on public.%I for each row execute function public.protect_private_record()', v_table);
    execute format('create trigger audit_record after insert or update on public.%I for each row execute function public.audit_private_record()', v_table);
  end loop;
end $$;
-- Sem DELETE do cliente: exclusão/retencão e correção de documentos precisam de fluxo explícito.

-- Curadoria regulatória: somente publicação revisada é exposta publicamente.
create table public.regulatory_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_url text not null check (source_url ~ '^https://'),
  source_published_at date,
  effective_at date,
  legal_status text not null check (legal_status in ('proposal', 'published', 'in_force', 'revoked')),
  summary text not null,
  penalty_reference text,
  reviewed_at timestamptz,
  published boolean not null default false,
  check (not published or reviewed_at is not null)
);
alter table public.regulatory_updates enable row level security;
revoke all on public.regulatory_updates from anon, authenticated;
grant select on public.regulatory_updates to anon, authenticated;
create policy reviewed_regulatory_read on public.regulatory_updates for select to anon, authenticated using (published and reviewed_at is not null);

create function public.check_document_links() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'documents' then
    if new.recipient_id is null then return new; end if;
    if not exists (
      select 1 from public.offer_recipients r
      join public.offer_versions v on v.id = r.offer_version_id and v.organization_id = r.organization_id
      join public.offers o on o.id = v.offer_id and o.organization_id = v.organization_id
      where r.id = new.recipient_id and r.organization_id = new.organization_id and o.operation_id = new.operation_id
    ) then raise exception 'Destinatário não pertence à operação do documento'; end if;
  elsif tg_table_name = 'responses' then
    if new.document_id is null then return new; end if;
    if not exists(select 1 from public.documents d where d.id = new.document_id and d.organization_id = new.organization_id and d.recipient_id = new.recipient_id) then
      raise exception 'Comprovante não pertence ao destinatário da resposta';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.check_document_links() from public, anon, authenticated;
create trigger check_links before insert or update on public.documents for each row execute function public.check_document_links();
create trigger check_links before insert or update on public.responses for each row execute function public.check_document_links();

create function public.record_susep_failure(
  p_run_key text, p_started_at timestamptz, p_finished_at timestamptz, p_source_url text, p_code_hash text, p_error_summary text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_source_url <> 'https://www2.susep.gov.br/menuatendimento/procura_2011.asp' then raise exception 'Origem SUSEP inesperada'; end if;
  insert into public.collection_runs(run_key,status,started_at,finished_at,source_url,code_hash,error_summary)
  values(p_run_key,'failed',p_started_at,p_finished_at,p_source_url,p_code_hash,left(p_error_summary,300))
  on conflict(run_key) do nothing returning id into v_id;
  if v_id is null then
    select id into v_id from public.collection_runs where run_key = p_run_key and status = 'failed';
    if v_id is null then raise exception 'Não é possível substituir snapshot validado por falha'; end if;
  end if;
  return v_id;
end $$;
revoke all on function public.record_susep_failure(text,timestamptz,timestamptz,text,text,text) from public, anon, authenticated;
grant execute on function public.record_susep_failure(text,timestamptz,timestamptz,text,text,text) to service_role;
