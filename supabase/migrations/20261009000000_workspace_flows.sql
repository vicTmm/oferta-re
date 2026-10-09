-- Todas as escritas passam pelas políticas RLS do usuário, em uma transação.
create function public.save_email_template(p_org uuid, p_template uuid, p_name text, p_subject text, p_body text, p_signature text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare t uuid; v integer;
begin
  if not public.has_org_role(p_org,array['owner','admin','member']) then raise exception 'Acesso negado'; end if;
  if length(btrim(p_name)) not between 2 and 120 or length(btrim(p_subject)) not between 1 and 300 or length(btrim(p_body)) not between 1 and 20000 or length(p_signature)>5000 then raise exception 'Modelo inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_org::text, 1));
  if p_template is null then
    insert into public.email_templates(organization_id,name) values(p_org,p_name) returning id into t;
  else
    update public.email_templates set name=p_name where id=p_template and organization_id=p_org returning id into t;
    if t is null then raise exception 'Modelo indisponível'; end if;
  end if;
  select coalesce(max(version),0)+1 into v from public.email_template_versions where template_id=t and organization_id=p_org;
  insert into public.email_template_versions(organization_id,template_id,version,subject,body,signature) values(p_org,t,v,p_subject,p_body,p_signature);
  return t;
end $$;
create function public.prepare_offer(p_org uuid, p_reference text, p_title text, p_cedent text, p_contract text, p_template uuid, p_subject text, p_body text, p_signature text, p_contacts uuid[])
returns uuid language plpgsql security invoker set search_path = '' as $$
declare op uuid; offer uuid; ver uuid; n integer;
begin
  if not public.has_org_role(p_org,array['owner','admin','member']) then raise exception 'Acesso negado'; end if;
  if length(btrim(p_reference)) not between 1 and 120 or length(btrim(p_title)) not between 1 and 200 or length(btrim(p_cedent)) not between 1 and 200 or length(btrim(p_subject)) not between 1 and 300 or length(btrim(p_body)) not between 1 and 20000 or length(p_signature)>5000 or coalesce(cardinality(p_contacts),0) not between 1 and 100 then raise exception 'Oferta inválida'; end if;
  select count(*) into n from public.contacts where organization_id=p_org and id=any(p_contacts);
  if n<>cardinality(p_contacts) then raise exception 'Destinatário indisponível'; end if;
  insert into public.operations(organization_id,reference,title,cedent_name,contract_reference) values(p_org,p_reference,p_title,p_cedent,nullif(p_contract,'')) returning id into op;
  insert into public.offers(organization_id,operation_id) values(p_org,op) returning id into offer;
  insert into public.offer_versions(organization_id,offer_id,template_version_id,version,subject,body,signature) values(p_org,offer,p_template,1,p_subject,p_body,p_signature) returning id into ver;
  insert into public.offer_recipients(organization_id,offer_version_id,contact_id,reinsurer_key,destination_email,destination_name)
  select p_org,ver,id,reinsurer_key,email,name from public.contacts where organization_id=p_org and id=any(p_contacts);
  return op;
end $$;
revoke all on function public.save_email_template(uuid,uuid,text,text,text,text),public.prepare_offer(uuid,text,text,text,text,uuid,text,text,text,uuid[]) from public,anon;
grant execute on function public.save_email_template(uuid,uuid,text,text,text,text),public.prepare_offer(uuid,text,text,text,text,uuid,text,text,text,uuid[]) to authenticated;
