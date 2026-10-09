-- Ativação progressiva; dados comerciais privados para owner/admin.
create table public.company_profiles (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null unique references public.organizations(id),
 payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=65536),
 revision integer not null default 1 check(revision>0),
 status text not null check(status in ('draft','complete')),
 completed_at timestamptz,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.business_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null check(char_length(btrim(name)) between 2 and 80),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id)
);
create unique index business_lines_name on public.business_lines(organization_id,lower(btrim(name)));
create table public.department_business_lines (
 organization_id uuid not null, department_id uuid not null, business_line_id uuid not null,
 primary key(department_id,business_line_id),
 foreign key(organization_id,department_id) references public.departments(organization_id,id),
 foreign key(organization_id,business_line_id) references public.business_lines(organization_id,id)
);
alter table public.company_profiles enable row level security;
alter table public.business_lines enable row level security;
alter table public.department_business_lines enable row level security;
revoke all on public.company_profiles,public.business_lines,public.department_business_lines from anon,authenticated;
grant select on public.company_profiles,public.business_lines,public.department_business_lines to authenticated;
create policy profiles_read on public.company_profiles for select to authenticated using(public.has_org_role(organization_id,array['owner','admin']));
create policy business_lines_read on public.business_lines for select to authenticated using(public.has_org_role(organization_id));
create policy department_lines_read on public.department_business_lines for select to authenticated using(public.has_org_role(organization_id));
create trigger protect_profile before update on public.company_profiles for each row execute function public.protect_private_record();
create trigger audit_profile after insert or update on public.company_profiles for each row execute function public.audit_private_record();
create trigger protect_line before update on public.business_lines for each row execute function public.protect_private_record();
create trigger audit_line after insert or update on public.business_lines for each row execute function public.audit_private_record();

create function public.save_company_onboarding(p_org uuid,p_payload jsonb,p_complete boolean,p_revision integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 old_revision integer; result_revision integer; payload jsonb:=p_payload; sector jsonb; sectors jsonb:='[]';
 key text; value text; limit_size integer; department uuid; line_id uuid; line jsonb; names text[]:='{}'; ids uuid[]:='{}';
begin
 if not public.has_org_role(p_org,array['owner','admin']) then raise exception 'Acesso negado'; end if;
 if p_complete is null or p_revision is null or p_revision<0 or jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>65536 then raise exception 'Configuração inválida';end if;
 -- Lista explícita de campos; não aceitar metadados arbitrários ou credenciais.
 for key in select jsonb_object_keys(payload) loop
  if not key=any(array['name','administrator','email','legalName','cnpj','billingEmail','website','phone','areas','sectors','outlook','mailbox','senderEmail','evidence','reference','hasContacts','users','monthlyOffers','tools','pain','goal','step']) then raise exception 'Campo inválido';end if;
 end loop;
 for key,limit_size in select * from (values ('name',120),('administrator',120),('email',254),('legalName',160),('cnpj',24),('billingEmail',254),('website',200),('phone',40),('outlook',20),('mailbox',20),('senderEmail',254),('reference',120),('hasContacts',10),('users',10),('monthlyOffers',10),('tools',500),('pain',1000),('goal',1000)) as fields(k,l) loop
  if jsonb_typeof(payload->key) is distinct from 'string' or char_length(btrim(payload->>key))>limit_size then raise exception 'Campo inválido: %',key;end if;
  payload:=jsonb_set(payload,array[key],to_jsonb(btrim(payload->>key)));
 end loop;
 foreach key in array array['email','billingEmail','senderEmail'] loop
  if payload->>key<>'' and payload->>key !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'E-mail inválido';end if;
 end loop;
 if payload->>'website'<>'' and payload->>'website' !~* '^https?://[^[:space:]]+$' then raise exception 'Site inválido';end if;
 if payload->>'cnpj'<>'' and payload->>'cnpj' !~ '^[A-Za-z0-9./-]+$' then raise exception 'CNPJ inválido';end if;
 if payload->>'outlook' not in ('','classic','new','web','other') or payload->>'mailbox' not in ('','individual','shared') or payload->>'hasContacts' not in ('','yes','no') or payload->>'users' not in ('','1-5','6-20','21-50','51+') or payload->>'monthlyOffers' not in ('','1-20','21-100','101-500','501+') then raise exception 'Opção inválida';end if;
 if jsonb_typeof(payload->'step') is distinct from 'number' or payload->>'step' not in ('0','1','2','3') then raise exception 'Etapa inválida';end if;
 if jsonb_typeof(payload->'areas') is distinct from 'array' or jsonb_typeof(payload->'sectors') is distinct from 'array' or jsonb_typeof(payload->'evidence') is distinct from 'array' then raise exception 'Estrutura inválida';end if;
 if jsonb_array_length(payload->'areas')>3 or jsonb_array_length(payload->'sectors')>30 or jsonb_array_length(payload->'evidence')>5 then raise exception 'Limite excedido';end if;
 if exists(select 1 from jsonb_array_elements(payload->'areas') a where jsonb_typeof(a)<>'string' or a#>>'{}' not in ('treaty','facultative','other')) or exists(select 1 from jsonb_array_elements(payload->'evidence') a where jsonb_typeof(a)<>'string' or a#>>'{}' not in ('msg','eml','pdf','image','other')) then raise exception 'Opção inválida';end if;
 if p_complete and (char_length(payload->>'name')<2 or char_length(payload->>'administrator')<2 or payload->>'email'='') then raise exception 'Preencha empresa e responsável';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_org::text,21));
 select revision into old_revision from public.company_profiles where organization_id=p_org for update;
 if coalesce(old_revision,0)<>p_revision then raise exception 'Configuração alterada por outra pessoa. Recarregue a página.';end if;
 -- Configurar depois cria setor mínimo somente na conclusão. Nunca remove setores existentes.
 if p_complete and jsonb_array_length(payload->'sectors')=0 and not exists(select 1 from public.departments where organization_id=p_org) then
  payload:=jsonb_set(payload,'{sectors}','[{"name":"Geral","area":"other","lines":[]}]');
 end if;
 for sector in select jsonb_array_elements(payload->'sectors') loop
  if jsonb_typeof(sector) is distinct from 'object' or jsonb_typeof(sector->'name') is distinct from 'string' or char_length(btrim(sector->>'name')) not between 2 and 100 or coalesce(sector->>'area','') not in ('treaty','facultative','other') or jsonb_typeof(sector->'lines') is distinct from 'array' then raise exception 'Setor inválido';end if;
  if exists(select 1 from jsonb_object_keys(sector) k where k not in ('id','name','area','lines')) then raise exception 'Campo de setor inválido';end if;
  value:=lower(btrim(sector->>'name'));
  if value=any(names) then raise exception 'Setor repetido';end if; names:=array_append(names,value);
  department:=null;
  if sector ? 'id' then
   if jsonb_typeof(sector->'id') is distinct from 'string' then raise exception 'Setor inválido';end if;
   department:=(sector->>'id')::uuid;
   if department=any(ids) or not exists(select 1 from public.departments where id=department and organization_id=p_org) then raise exception 'Setor de outra empresa ou repetido';end if;
   if exists(select 1 from public.departments where organization_id=p_org and id<>department and lower(btrim(name))=value) then raise exception 'Setor repetido';end if;
   update public.departments set name=btrim(sector->>'name'),area=sector->>'area' where id=department and organization_id=p_org;
  else
   select id into department from public.departments where organization_id=p_org and lower(btrim(name))=value order by created_at limit 1;
   if department is null then
    insert into public.departments(organization_id,name,area) values(p_org,btrim(sector->>'name'),sector->>'area') returning id into department;
   else
    update public.departments set area=sector->>'area' where id=department and organization_id=p_org;
   end if;
  end if;
  if department=any(ids) then raise exception 'Setor repetido';end if; ids:=array_append(ids,department);
  if jsonb_array_length(sector->'lines')>30 or exists(select 1 from jsonb_array_elements(sector->'lines') l where jsonb_typeof(l)<>'string' or char_length(btrim(l#>>'{}')) not between 2 and 80) then raise exception 'Linha inválida';end if;
  if (select count(*) from jsonb_array_elements(sector->'lines'))<>(select count(distinct lower(btrim(l#>>'{}'))) from jsonb_array_elements(sector->'lines') l) then raise exception 'Linha repetida';end if;
  delete from public.department_business_lines where organization_id=p_org and department_id=department;
  for line in select jsonb_array_elements(sector->'lines') loop
   select id into line_id from public.business_lines where organization_id=p_org and lower(btrim(name))=lower(btrim(line#>>'{}'));
   if line_id is null then insert into public.business_lines(organization_id,name) values(p_org,btrim(line#>>'{}')) returning id into line_id;end if;
   insert into public.department_business_lines(organization_id,department_id,business_line_id) values(p_org,department,line_id);
  end loop;
  sectors:=sectors || jsonb_build_array(jsonb_set(sector,'{id}',to_jsonb(department)));
 end loop;
 payload:=jsonb_set(payload,'{sectors}',sectors);
 if char_length(payload->>'name')>=2 then update public.organizations set name=payload->>'name' where id=p_org;end if;
 insert into public.company_profiles(organization_id,payload,status,completed_at)
 values(p_org,payload,case when p_complete then 'complete' else 'draft' end,case when p_complete then now() end)
 on conflict(organization_id) do update set payload=excluded.payload,revision=company_profiles.revision+1,status=excluded.status,completed_at=coalesce(excluded.completed_at,company_profiles.completed_at)
 returning revision into result_revision;
 return jsonb_build_object('revision',result_revision,'payload',payload,'complete',p_complete);
end $$;
revoke all on function public.save_company_onboarding(uuid,jsonb,boolean,integer) from public,anon;
grant execute on function public.save_company_onboarding(uuid,jsonb,boolean,integer) to authenticated;
