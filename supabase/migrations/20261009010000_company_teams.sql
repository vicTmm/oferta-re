-- Empresa = tenant. Setores organizam o trabalho; não são empresas independentes.
create table public.departments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 name text not null check(char_length(btrim(name)) between 2 and 100),
 area text not null check(area in ('treaty','facultative','other')),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,name)
);
create table public.department_members (
 organization_id uuid not null,
 department_id uuid not null,
 user_id uuid not null,
 created_at timestamptz not null default now(),
 primary key(department_id,user_id),
 foreign key(organization_id,department_id) references public.departments(organization_id,id),
 foreign key(organization_id,user_id) references public.organization_members(organization_id,user_id)
);
create index department_members_user on public.department_members(user_id,organization_id);
alter table public.departments enable row level security;
alter table public.department_members enable row level security;
revoke all on public.departments,public.department_members from anon,authenticated;
grant select on public.departments,public.department_members to authenticated;
grant insert,update on public.departments to authenticated;
create policy departments_read on public.departments for select to authenticated using(public.has_org_role(organization_id));
create policy departments_insert on public.departments for insert to authenticated with check(public.has_org_role(organization_id,array['owner','admin']) and created_by=auth.uid());
create policy departments_update on public.departments for update to authenticated using(public.has_org_role(organization_id,array['owner','admin'])) with check(public.has_org_role(organization_id,array['owner','admin']));
create policy department_members_read on public.department_members for select to authenticated using(public.has_org_role(organization_id));
create trigger protect_department before update on public.departments for each row execute function public.protect_private_record();
create trigger audit_department after insert or update on public.departments for each row execute function public.audit_private_record();

create table public.organization_invitations (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 email text not null check(email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 role text not null check(role in ('admin','member','viewer')),
 department_id uuid,
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 invited_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '7 days',
 accepted_at timestamptz,
 revoked_at timestamptz,
 foreign key(organization_id,department_id) references public.departments(organization_id,id)
);
create index invitations_org on public.organization_invitations(organization_id);
alter table public.organization_invitations enable row level security;
revoke all on public.organization_invitations from anon,authenticated;
-- O hash não precisa ser exposto na lista de convites.
grant select(id,organization_id,email,role,department_id,invited_by,created_at,expires_at,accepted_at,revoked_at) on public.organization_invitations to authenticated;
create policy invitations_read on public.organization_invitations for select to authenticated using(public.has_org_role(organization_id,array['owner','admin']));

create function public.create_company_invitation(p_org uuid,p_email text,p_role text,p_department uuid,p_hash text)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not public.has_org_role(p_org,array['owner','admin']) or (p_role='admin' and not public.has_org_role(p_org,array['owner'])) then raise exception 'Acesso negado';end if;
 insert into public.organization_invitations(organization_id,email,role,department_id,token_hash,invited_by)
 values(p_org,lower(btrim(p_email)),p_role,p_department,p_hash,auth.uid()) returning id into result;
 return result;
end $$;
create function public.revoke_company_invitation(p_org uuid,p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_org_role(p_org,array['owner','admin']) then raise exception 'Acesso negado';end if;
 update public.organization_invitations set revoked_at=now() where id=p_id and organization_id=p_org and accepted_at is null;
end $$;
create function public.accept_company_invitation(p_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.organization_invitations; email_address text;
begin
 if auth.uid() is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Convite indisponível';end if;
 select lower(email) into email_address from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if email_address is null then raise exception 'Confirme o e-mail da conta';end if;
 select * into invitation from public.organization_invitations where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and accepted_at is null and revoked_at is null and expires_at>now() for update;
 if invitation.id is null or invitation.email<>email_address then raise exception 'Convite indisponível';end if;
 insert into public.organization_members(organization_id,user_id,role) values(invitation.organization_id,auth.uid(),invitation.role) on conflict do nothing;
 -- Convite nunca promove um membro que já existe na empresa.
 if invitation.department_id is not null then
  insert into public.department_members(organization_id,department_id,user_id) values(invitation.organization_id,invitation.department_id,auth.uid()) on conflict do nothing;
 end if;
 update public.organization_invitations set accepted_at=now() where id=invitation.id;
 return invitation.organization_id;
end $$;
create function public.assign_department_member(p_org uuid,p_department uuid,p_user uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_org_role(p_org,array['owner','admin']) then raise exception 'Acesso negado';end if;
 insert into public.department_members(organization_id,department_id,user_id) values(p_org,p_department,p_user) on conflict do nothing;
end $$;
create function public.company_team(p_org uuid)
returns table(user_id uuid,email text,role text,departments text[]) language plpgsql security definer set search_path='' as $$
begin
 if not public.has_org_role(p_org,array['owner','admin']) then raise exception 'Acesso negado';end if;
 return query select m.user_id,u.email::text,m.role,array(select d.name from public.department_members dm join public.departments d on d.id=dm.department_id and d.organization_id=dm.organization_id where dm.organization_id=p_org and dm.user_id=m.user_id order by d.name)
 from public.organization_members m join auth.users u on u.id=m.user_id where m.organization_id=p_org;
end $$;
revoke all on function public.create_company_invitation(uuid,text,text,uuid,text),public.revoke_company_invitation(uuid,uuid),public.accept_company_invitation(text),public.assign_department_member(uuid,uuid,uuid),public.company_team(uuid) from public,anon;
grant execute on function public.create_company_invitation(uuid,text,text,uuid,text),public.revoke_company_invitation(uuid,uuid),public.accept_company_invitation(text),public.assign_department_member(uuid,uuid,uuid),public.company_team(uuid) to authenticated;

-- Registros sem setor continuam compartilhados na empresa. A separação interna
-- de acesso interna não é exigida: o autor escolheu compartilhar por empresa.
do $$ declare t text;begin
 foreach t in array array['contacts','email_templates','operations'] loop
  execute format('alter table public.%I add column department_id uuid',t);
  execute format('alter table public.%I add foreign key(organization_id,department_id) references public.departments(organization_id,id)',t);
  execute format('create index on public.%I(organization_id,department_id)',t);
 end loop;
end $$;

-- Todas as escritas passam pelas políticas RLS do usuário, em uma transação.
drop function public.save_email_template(uuid,uuid,text,text,text,text);
create function public.save_email_template(p_org uuid, p_template uuid, p_name text, p_subject text, p_body text, p_signature text, p_department uuid default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare t uuid; v integer;
begin
  if not public.has_org_role(p_org,array['owner','admin','member']) then raise exception 'Acesso negado'; end if;
  if length(btrim(p_name)) not between 2 and 120 or length(btrim(p_subject)) not between 1 and 300 or length(btrim(p_body)) not between 1 and 20000 or length(p_signature)>5000 then raise exception 'Modelo inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_org::text, 1));
  if p_template is null then
    insert into public.email_templates(organization_id,name,department_id) values(p_org,p_name,p_department) returning id into t;
  else
    update public.email_templates set name=p_name,department_id=p_department where id=p_template and organization_id=p_org returning id into t;
    if t is null then raise exception 'Modelo indisponível'; end if;
  end if;
  select coalesce(max(version),0)+1 into v from public.email_template_versions where template_id=t and organization_id=p_org;
  insert into public.email_template_versions(organization_id,template_id,version,subject,body,signature) values(p_org,t,v,p_subject,p_body,p_signature);
  return t;
end $$;
drop function public.prepare_offer(uuid,text,text,text,text,uuid,text,text,text,uuid[]);
create function public.prepare_offer(p_org uuid, p_reference text, p_title text, p_cedent text, p_contract text, p_template uuid, p_subject text, p_body text, p_signature text, p_contacts uuid[], p_department uuid default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare op uuid; offer uuid; ver uuid; n integer;
begin
  if not public.has_org_role(p_org,array['owner','admin','member']) then raise exception 'Acesso negado'; end if;
  if length(btrim(p_reference)) not between 1 and 120 or length(btrim(p_title)) not between 1 and 200 or length(btrim(p_cedent)) not between 1 and 200 or length(btrim(p_subject)) not between 1 and 300 or length(btrim(p_body)) not between 1 and 20000 or length(p_signature)>5000 or coalesce(cardinality(p_contacts),0) not between 1 and 100 then raise exception 'Oferta inválida'; end if;
  select count(*) into n from public.contacts where organization_id=p_org and id=any(p_contacts);
  if n<>cardinality(p_contacts) then raise exception 'Destinatário indisponível'; end if;
  insert into public.operations(organization_id,reference,title,cedent_name,contract_reference,department_id) values(p_org,p_reference,p_title,p_cedent,nullif(p_contract,''),p_department) returning id into op;
  insert into public.offers(organization_id,operation_id) values(p_org,op) returning id into offer;
  insert into public.offer_versions(organization_id,offer_id,template_version_id,version,subject,body,signature) values(p_org,offer,p_template,1,p_subject,p_body,p_signature) returning id into ver;
  insert into public.offer_recipients(organization_id,offer_version_id,contact_id,reinsurer_key,destination_email,destination_name)
  select p_org,ver,id,reinsurer_key,email,name from public.contacts where organization_id=p_org and id=any(p_contacts);
  return op;
end $$;
revoke all on function public.save_email_template(uuid,uuid,text,text,text,text,uuid),public.prepare_offer(uuid,text,text,text,text,uuid,text,text,text,uuid[],uuid) from public,anon;
grant execute on function public.save_email_template(uuid,uuid,text,text,text,text,uuid),public.prepare_offer(uuid,text,text,text,text,uuid,text,text,text,uuid[],uuid) to authenticated;
