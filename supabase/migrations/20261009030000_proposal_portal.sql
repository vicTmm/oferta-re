-- Proposta é a operação; ofertas/versões são comunicações dentro dela.
alter table public.operations
 add column business_kind text not null default 'new_business' check(business_kind in ('new_business','renewal')),
 add column stage text not null default 'preparation' check(stage in ('preparation','review','market','negotiation','placed','not_placed','cancelled','closed')),
 add column insured_name text check(char_length(insured_name)<=200),
 add column business_line_id uuid,
 add column prior_operation_id uuid,
 add column coverage_start date,
 add column coverage_end date,
 add column due_date date,
 add column next_action text not null default '' check(char_length(next_action)<=1000),
 add column closure_note text not null default '' check(char_length(closure_note)<=2000),
 add column proposal_revision integer not null default 0 check(proposal_revision>=0),
 add constraint operation_business_line foreign key(organization_id,business_line_id) references public.business_lines(organization_id,id),
 add constraint operation_prior foreign key(organization_id,prior_operation_id) references public.operations(organization_id,id),
 add constraint operation_prior_not_self check(prior_operation_id is null or prior_operation_id<>id),
 add constraint operation_prior_renewal check(prior_operation_id is null or business_kind='renewal'),
 add constraint operation_coverage check(coverage_end is null or coverage_start is null or coverage_end>=coverage_start);
-- Preservar o significado de estados legados, sem reabrir negócios.
update public.operations set stage=case status when 'open' then 'market' when 'closed' then 'closed' when 'cancelled' then 'cancelled' else 'preparation' end;

create table public.proposal_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, operation_id uuid not null,
 event_type text not null check(event_type in ('created','stage_changed','details_updated','response_recorded','response_updated','offer_prepared','send_recorded')),
 details_before jsonb, details_after jsonb not null default '{}',
 from_stage text, to_stage text not null, note text not null default '',
 actor_id uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(),
 foreign key(organization_id,operation_id) references public.operations(organization_id,id)
);
create index proposal_events_operation on public.proposal_events(organization_id,operation_id,created_at);
create index proposal_due on public.operations(organization_id,due_date) where stage not in ('placed','not_placed','cancelled','closed');
alter table public.proposal_events enable row level security;
revoke all on public.proposal_events from anon,authenticated;
grant select on public.proposal_events to authenticated;
create policy proposal_events_read on public.proposal_events for select to authenticated using(public.has_org_role(organization_id));

create function public.validate_proposal_record() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' then
  if new.stage=old.stage and new.status<>old.status then
   new.stage:=case new.status when 'draft' then 'preparation' when 'open' then 'market' when 'closed' then 'closed' else 'cancelled' end;
  end if;
  new.proposal_revision:=old.proposal_revision+1;
 end if;
 new.status:=case when new.stage in ('preparation','review') then 'draft' when new.stage in ('market','negotiation') then 'open' when new.stage='cancelled' then 'cancelled' else 'closed' end;
 if new.stage in ('placed','not_placed','cancelled','closed') and char_length(btrim(new.closure_note))<2 then raise exception 'Informe o motivo do encerramento';end if;
 if new.stage not in ('placed','not_placed','cancelled','closed') and new.closure_note<>'' then raise exception 'Motivo de encerramento só se aplica ao encerramento';end if;
 if new.prior_operation_id is not null then
  -- Serializa mudanças na cadeia de renovação para evitar ciclos concorrentes.
  perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text,24));
  if exists(with recursive predecessors as (
    select id,prior_operation_id from public.operations where id=new.prior_operation_id and organization_id=new.organization_id
    union select o.id,o.prior_operation_id from public.operations o join predecessors p on o.id=p.prior_operation_id where o.organization_id=new.organization_id
   ) select 1 from predecessors where id=new.id) then raise exception 'Ciclo de renovação inválido';end if;
 end if;
 return new;
end $$;
create trigger validate_proposal before insert or update on public.operations for each row execute function public.validate_proposal_record();
create function public.log_proposal_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.proposal_events(organization_id,operation_id,event_type,from_stage,to_stage,note,actor_id,details_before,details_after)
 values(new.organization_id,new.id,case when tg_op='INSERT' then 'created' when new.stage<>old.stage then 'stage_changed' else 'details_updated' end,
 case when tg_op='UPDATE' then old.stage end,new.stage,case when new.stage in ('placed','not_placed','cancelled','closed') then new.closure_note else new.next_action end,auth.uid(),case when tg_op='UPDATE' then to_jsonb(old) end,to_jsonb(new));
 return new;
end $$;
create trigger log_proposal after insert or update on public.operations for each row execute function public.log_proposal_event();
revoke all on function public.validate_proposal_record(),public.log_proposal_event() from public,anon,authenticated;

create function public.save_proposal(p_org uuid,p_id uuid,p_revision integer,p_reference text,p_title text,p_cedent text,p_contract text,p_kind text,p_insured text,p_department uuid,p_line uuid,p_prior uuid,p_start date,p_end date,p_due date,p_next text,p_stage text,p_closure text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
 if not public.has_org_role(p_org,array['owner','admin','member']) then raise exception 'Acesso negado';end if;
 if p_reference is null or char_length(btrim(p_reference)) not between 1 and 120 or p_title is null or char_length(btrim(p_title)) not between 1 and 200 or p_cedent is null or char_length(btrim(p_cedent)) not between 1 and 200 or p_contract is null or char_length(p_contract)>120 or p_insured is null or char_length(p_insured)>200 or p_next is null or p_closure is null or p_kind is null or p_stage is null then raise exception 'Proposta inválida';end if;
 if p_id is null then
  if p_stage<>'preparation' or p_revision is distinct from 0 then raise exception 'Nova proposta inicia em preparação';end if;
  insert into public.operations(organization_id,reference,title,cedent_name,contract_reference,business_kind,insured_name,department_id,business_line_id,prior_operation_id,coverage_start,coverage_end,due_date,next_action,stage,closure_note)
  values(p_org,btrim(p_reference),btrim(p_title),btrim(p_cedent),nullif(btrim(p_contract),''),p_kind,nullif(btrim(p_insured),''),p_department,p_line,p_prior,p_start,p_end,p_due,btrim(p_next),p_stage,btrim(p_closure)) returning id into result;
 else
  update public.operations set reference=btrim(p_reference),title=btrim(p_title),cedent_name=btrim(p_cedent),contract_reference=nullif(btrim(p_contract),''),business_kind=p_kind,insured_name=nullif(btrim(p_insured),''),department_id=p_department,business_line_id=p_line,prior_operation_id=p_prior,coverage_start=p_start,coverage_end=p_end,due_date=p_due,next_action=btrim(p_next),stage=p_stage,closure_note=btrim(p_closure)
  where organization_id=p_org and id=p_id and proposal_revision=p_revision returning id into result;
  if result is null then raise exception 'Proposta indisponível ou alterada. Recarregue a página.';end if;
 end if;
 return result;
end $$;

create function public.prepare_proposal_offer(p_org uuid,p_operation uuid,p_offer uuid,p_template uuid,p_subject text,p_body text,p_signature text,p_contacts uuid[])
returns uuid language plpgsql security invoker set search_path='' as $$
declare offer uuid; ver uuid; version_number integer; n integer; proposal public.operations;
begin
 if not public.has_org_role(p_org,array['owner','admin','member']) then raise exception 'Acesso negado';end if;
 select * into proposal from public.operations where id=p_operation and organization_id=p_org for update;
 if proposal.id is null or proposal.stage in ('placed','not_placed','cancelled','closed') then raise exception 'Proposta indisponível ou encerrada';end if;
 if p_subject is null or char_length(btrim(p_subject)) not between 1 and 300 or p_body is null or char_length(btrim(p_body)) not between 1 and 20000 or p_signature is null or char_length(p_signature)>5000 or (p_subject||p_body||p_signature) ~ '\{\{[^}]+\}\}' or coalesce(cardinality(p_contacts),0) not between 1 and 100 then raise exception 'Oferta inválida';end if;
 select count(*) into n from public.contacts where organization_id=p_org and id=any(p_contacts);
 if n<>cardinality(p_contacts) then raise exception 'Destinatário indisponível';end if;
 if p_offer is null then
  insert into public.offers(organization_id,operation_id) values(p_org,p_operation) returning id into offer;
 else
  select id into offer from public.offers where organization_id=p_org and operation_id=p_operation and id=p_offer;
  if offer is null then raise exception 'Oferta de outra proposta';end if;
 end if;
 select coalesce(max(version),0)+1 into version_number from public.offer_versions where organization_id=p_org and offer_id=offer;
 insert into public.offer_versions(organization_id,offer_id,template_version_id,version,subject,body,signature)
 values(p_org,offer,p_template,version_number,p_subject,p_body,p_signature) returning id into ver;
 insert into public.offer_recipients(organization_id,offer_version_id,contact_id,reinsurer_key,destination_email,destination_name)
 select p_org,ver,id,reinsurer_key,email,name from public.contacts where organization_id=p_org and id=any(p_contacts);
 if proposal.stage='preparation' then update public.operations set stage='review' where id=p_operation and organization_id=p_org;end if;
 return p_operation;
end $$;
revoke all on function public.save_proposal(uuid,uuid,integer,text,text,text,text,text,text,uuid,uuid,uuid,date,date,date,text,text,text),public.prepare_proposal_offer(uuid,uuid,uuid,uuid,text,text,text,uuid[]) from public,anon;
grant execute on function public.save_proposal(uuid,uuid,integer,text,text,text,text,text,text,uuid,uuid,uuid,date,date,date,text,text,text),public.prepare_proposal_offer(uuid,uuid,uuid,uuid,text,text,text,uuid[]) to authenticated;

-- Notas sem original não são respostas arquivadas. Preservar registros legados, bloquear novas gravações sem arquivo.
create function public.require_response_evidence() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not public.has_org_role(new.organization_id,array['owner','admin','member']) then raise exception 'Acesso negado';end if;
 if new.document_id is null or not exists(
  select 1 from public.documents d join storage.objects o on o.name=d.storage_path and o.bucket_id='operation-documents'
  where d.id=new.document_id and d.organization_id=new.organization_id and d.recipient_id=new.recipient_id and d.kind='response'
 ) then raise exception 'Anexe e conclua o upload do comprovante da resposta';end if;
 return new;
end $$;
create trigger require_response_evidence before insert or update on public.responses for each row execute function public.require_response_evidence();
create function public.log_response_event() returns trigger language plpgsql security definer set search_path='' as $$
declare operation uuid; current_stage text;
begin
 select o.id,o.stage into operation,current_stage from public.offer_recipients r
 join public.offer_versions v on v.organization_id=r.organization_id and v.id=r.offer_version_id
 join public.offers f on f.organization_id=v.organization_id and f.id=v.offer_id
 join public.operations o on o.organization_id=f.organization_id and o.id=f.operation_id
 where r.organization_id=new.organization_id and r.id=new.recipient_id;
 insert into public.proposal_events(organization_id,operation_id,event_type,to_stage,note,actor_id,details_before,details_after)
 values(new.organization_id,operation,case when tg_op='INSERT' then 'response_recorded' else 'response_updated' end,current_stage,coalesce(new.note,''),auth.uid(),case when tg_op='UPDATE' then to_jsonb(old) end,to_jsonb(new));
 return new;
end $$;
create trigger log_response after insert or update on public.responses for each row execute function public.log_response_event();
revoke all on function public.require_response_evidence(),public.log_response_event() from public,anon,authenticated;

create function public.log_market_event() returns trigger language plpgsql security definer set search_path='' as $$
declare operation uuid; current_stage text;
begin
 if tg_table_name='offer_versions' then
  select o.id,o.stage into operation,current_stage from public.offers f join public.operations o on o.organization_id=f.organization_id and o.id=f.operation_id where f.organization_id=new.organization_id and f.id=new.offer_id;
  insert into public.proposal_events(organization_id,operation_id,event_type,to_stage,note,actor_id,details_after)
  values(new.organization_id,operation,'offer_prepared',current_stage,'Versão '||new.version||' · '||new.subject,auth.uid(),jsonb_build_object('offer_version_id',new.id,'offer_id',new.offer_id,'version',new.version));
 elsif new.sent_at is not null and new.sent_at is distinct from old.sent_at then
  select o.id,o.stage into operation,current_stage from public.offer_versions v join public.offers f on f.organization_id=v.organization_id and f.id=v.offer_id join public.operations o on o.organization_id=f.organization_id and o.id=f.operation_id where v.organization_id=new.organization_id and v.id=new.offer_version_id;
  insert into public.proposal_events(organization_id,operation_id,event_type,to_stage,note,actor_id,details_before,details_after)
  values(new.organization_id,operation,'send_recorded',current_stage,'Envio informado pela equipe · '||new.destination_name,auth.uid(),to_jsonb(old),to_jsonb(new));
 end if;
 return new;
end $$;
create trigger log_offer_preparation after insert on public.offer_versions for each row execute function public.log_market_event();
create trigger log_market_sending after update on public.offer_recipients for each row execute function public.log_market_event();
revoke all on function public.log_market_event() from public,anon,authenticated;
