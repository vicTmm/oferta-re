import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, storage to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint);
  create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant select, insert, update, delete on storage.objects to authenticated;
`);
const dir = new URL('../../supabase/migrations/', import.meta.url);
for (const file of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) {
  if(file==='20261009030000_proposal_portal.sql') {
    await db.exec(`insert into auth.users(id) values('00000000-0000-4000-8000-000000000701');
      insert into organizations(id,name,created_by) values('00000000-0000-4000-8000-000000000702','Legado sintético','00000000-0000-4000-8000-000000000701');
      insert into operations(id,organization_id,reference,title,cedent_name,status,created_by) values('00000000-0000-4000-8000-000000000703','00000000-0000-4000-8000-000000000702','LEGACY-CLOSED','Negócio encerrado','Cedente sintética','closed','00000000-0000-4000-8000-000000000701');`);
  }
  await db.exec(await readFile(new URL(file, dir), 'utf8'));
}
const userA = '00000000-0000-0000-0000-000000000001';
const userB = '00000000-0000-0000-0000-000000000002';
const viewer = '00000000-0000-0000-0000-000000000003';
await db.query('insert into auth.users(id) values ($1),($2),($3)', [userA, userB, viewer]);
async function asUser(user, fn) {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
const orgA = await asUser(userA, async () => (await db.query("select public.create_organization('Corretora A') id")).rows[0].id);
const orgB = await asUser(userB, async () => (await db.query("select public.create_organization('Corretora B') id")).rows[0].id);
await db.query("insert into public.organization_members(organization_id,user_id,role) values($1,$2,'viewer')", [orgA, viewer]);
const contactA = await asUser(userA, async () => (await db.query("insert into contacts(organization_id,reinsurer_key,name,email) values($1,'local::1','Sintético','teste@example.com') returning id", [orgA])).rows[0].id);
const opA = await asUser(userA, async () => (await db.query("insert into operations(organization_id,reference,title,cedent_name) values($1,'A-1','Operação teste','Cedente sintética') returning id", [orgA])).rows[0].id);
const doc = await asUser(userA, async () => {
  const id = '00000000-0000-0000-0000-000000000010';
  const path = `${orgA}/${opA}/${id}`;
  await db.query("insert into documents(id,organization_id,operation_id,kind,original_name,storage_path,sha256,size_bytes,media_type) values($1,$2,$3,'response','teste.pdf',$4,$5,100,'application/pdf')", [id,orgA,opA,path,'a'.repeat(64)]);
  await db.query("insert into storage.objects(bucket_id,name) values('operation-documents',$1)", [path]);
  return {id,path};
});

test('migrations execute on PostgreSQL and enable RLS on every public table', async () => {
  const tables = (await db.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity")).rows;
  assert.deepEqual(tables, []);
});
test('another organization cannot read, update, insert or link private records', async () => {
  await asUser(userB, async () => {
    assert.equal((await db.query('select * from contacts')).rows.length, 0);
    assert.equal((await db.query("update contacts set name='inválido' where id=$1 returning id", [contactA])).rows.length, 0);
    await assert.rejects(db.query("insert into contacts(organization_id,reinsurer_key,name,email) values($1,'local::2','Inválido','b@example.com')", [orgA]), /row-level security/);
    await assert.rejects(db.query('insert into offers(organization_id,operation_id) values($1,$2)', [orgB,opA]), /foreign key/);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('operation-documents',$1)", [doc.path]), /row-level security/);
  });
});
test('viewer reads only their organization and cannot write', async () => {
  await asUser(viewer, async () => {
    assert.equal((await db.query('select * from contacts')).rows.length, 1);
    assert.equal((await db.query("update contacts set name='inválido' returning id")).rows.length, 0);
    await assert.rejects(db.query("insert into contacts(organization_id,reinsurer_key,name,email) values($1,'local::3','Inválido','v@example.com')", [orgA]), /row-level security/);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 1);
  });
});
test('membership escalation, forged authorship, moving organizations and audit mutation are denied', async () => {
  await asUser(userA, async () => {
    await assert.rejects(db.query("update organization_members set role='owner'"), /permission denied/);
    await assert.rejects(db.query("insert into contacts(organization_id,reinsurer_key,name,email,created_by) values($1,'local::2','Inválido','x@example.com',$2)", [orgA,userB]), /row-level security/);
    await assert.rejects(db.query('update contacts set organization_id=$1 where id=$2', [orgB,contactA]), /imutáveis/);
    assert.ok((await db.query('select * from audit_events')).rows.length > 0);
    await assert.rejects(db.query('delete from audit_events'), /permission denied/);
    assert.equal((await db.query("update storage.objects set name='overwrite' returning id")).rows.length, 0);
  });
});
test('anonymous can read only public data, not private tables or privileged RPCs', async () => {
  await db.exec('set role anon');
  try {
    await db.query('select * from latest_public_reinsurers');
    await assert.rejects(db.query('select * from contacts'), /permission denied/);
    await assert.rejects(db.query("select create_organization('Inválido')"), /permission denied/);
    await assert.rejects(db.query("select publish_susep_collection('x',now(),now(),'x','x','x','[]'::jsonb)"), /permission denied/);
  } finally { await db.exec('reset role'); }
});
const source = 'https://www2.susep.gov.br/menuatendimento/procura_2011.asp';
const snapshot = ['Local','Admitida','Eventual'].map((kind,i) => ({chave_monitoramento:`${kind}::${i}`,nome:'Sintética',entcodigo:`00${i}`,cnpj:'001',tipo:`Resseguradora ${kind}`}));
async function publish(key, rows, finished = '2026-10-08T21:00:00Z', hash='b'.repeat(64)) {
  await db.exec('set role service_role');
  try { return await db.query('select publish_susep_collection($1,$2,$3,$4,$5,$6,$7::jsonb) id', [key,'2026-10-08T20:00:00Z',finished,source,hash,'c'.repeat(64),JSON.stringify(rows)]); }
  finally { await db.exec('reset role'); }
}
test('publication is atomic, idempotent and rejects partial data and stale snapshots', async () => {
  const id = (await publish('test-1',snapshot)).rows[0].id;
  assert.equal((await publish('test-1',snapshot)).rows[0].id, id);
  await assert.rejects(publish('test-2', snapshot.slice(0,2), '2026-10-08T22:00:00Z'), /Categoria ausente/);
  await assert.rejects(publish('test-3', [...snapshot,snapshot[0]], '2026-10-08T22:00:00Z'), /duplicadas/);
  await assert.rejects(publish('test-4', snapshot, '2026-10-08T20:30:00Z'), /fora de ordem/);
  assert.equal((await db.query('select * from latest_public_reinsurers')).rows.length, 3);
  assert.equal((await db.query('select * from collection_runs')).rows.length, 1);
});

test('template changes append immutable versions and deny viewers', async()=>{
 const t=await asUser(userA,async()=>(await db.query("select public.save_email_template($1,null,'Modelo teste','Assunto inicial','Corpo inicial','Assinatura') id",[orgA])).rows[0].id);
 await asUser(userA,()=>db.query("select public.save_email_template($1,$2,'Modelo teste','Novo assunto','Novo corpo','Nova assinatura')",[orgA,t]));
 const result=await asUser(userA,()=>db.query('select version,body from public.email_template_versions where template_id=$1 order by version',[t]));
 assert.deepEqual(result.rows,[{version:1,body:'Corpo inicial'},{version:2,body:'Novo corpo'}]);
 await assert.rejects(asUser(viewer,()=>db.query("select public.save_email_template($1,$2,'Modelo teste','Invasão','Corpo','')",[orgA,t])));
 await assert.rejects(asUser(userB,()=>db.query("select public.save_email_template($1,$2,'Modelo teste','Invasão','Corpo','')",[orgA,t])));
});
test('offer preparation snapshots contacts atomically and rolls back invalid recipients',async()=>{
 const contact=await asUser(userA,async()=>(await db.query("insert into public.contacts(organization_id,reinsurer_key,name,email) values($1,'exemplo','Contato antes','offer-test@example.com') returning id",[orgA])).rows[0].id);
 const args=[orgA,'TEST-FLOW-001','Operação teste','Cedente teste','',null,'Assunto','Corpo','',[contact]];
 const op=await asUser(userA,async()=>(await db.query('select public.prepare_offer($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) id',args)).rows[0].id);
 await asUser(userA,()=>db.query("update public.contacts set name='Contato depois',email='changed@example.com' where id=$1",[contact]));
 const recipients=await asUser(userA,()=>db.query('select r.destination_name,r.destination_email from public.offer_recipients r join public.offer_versions v on v.id=r.offer_version_id join public.offers o on o.id=v.offer_id where o.operation_id=$1',[op]));
 assert.deepEqual(recipients.rows,[{destination_name:'Contato antes',destination_email:'offer-test@example.com'}]);
 for(const ids of [[],null,[contact,'00000000-0000-4000-8000-000000000999'],[contact,contact]]){
  await assert.rejects(asUser(userA,()=>db.query('select public.prepare_offer($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[...args.slice(0,1),'TEST-INVALID',...args.slice(2,9),ids])));
 }
 const invalid=await asUser(userA,()=>db.query("select count(*)::int n from public.operations where reference='TEST-INVALID'"));assert.equal(invalid.rows[0].n,0);
 await assert.rejects(asUser(viewer,()=>db.query('select public.prepare_offer($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[orgA,'VIEWER',...args.slice(2)])));
});

test('departments share company records but never cross company boundaries',async()=>{
 const dep=await asUser(userA,async()=>(await db.query("insert into departments(organization_id,name,area) values($1,'Property','facultative') returning id",[orgA])).rows[0].id);
 await asUser(userA,()=>db.query('select public.assign_department_member($1,$2,$3)',[orgA,dep,userA]));
 await asUser(userA,()=>db.query('select public.assign_department_member($1,$2,$3)',[orgA,dep,viewer]));
 await assert.rejects(asUser(viewer,()=>db.query('select public.assign_department_member($1,$2,$3)',[orgA,dep,userB])));
 await assert.rejects(asUser(userB,()=>db.query('select public.assign_department_member($1,$2,$3)',[orgB,dep,userB])),/foreign key/);
 assert.equal((await asUser(userB,()=>db.query('select * from departments where organization_id=$1',[orgA]))).rows.length,0);
 await asUser(userA,()=>db.query('update contacts set department_id=$1 where id=$2',[dep,contactA]));
 assert.equal((await asUser(viewer,()=>db.query('select department_id from contacts where id=$1',[contactA]))).rows[0].department_id,dep);
 const team=await asUser(userA,()=>db.query('select * from public.company_team($1)',[orgA]));assert.ok(team.rows.find(m=>m.user_id===viewer).departments.includes('Property'));
 await assert.rejects(asUser(userB,()=>db.query('select * from public.company_team($1)',[orgA])));
 await assert.rejects(asUser(viewer,()=>db.query('select * from public.company_team($1)',[orgA])));
 await assert.rejects(asUser(viewer,()=>db.query("insert into departments(organization_id,name,area) values($1,'Treaty','treaty')",[orgA])));
});
test('company invitations require the right verified email, expire, revoke and cannot elevate existing users',async()=>{
 const newUser='00000000-0000-4000-8000-000000000800';
 await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'invite-test@example.com',null)",[newUser]);
 await db.query("update auth.users set email='owner-test@example.com',email_confirmed_at=now() where id=$1",[userA]);
 const hash=token=>(db.query("select encode(sha256(convert_to($1,'UTF8')),'hex') h",[token])).then(r=>r.rows[0].h);
 const create=async(token,role='viewer')=>asUser(userA,async()=>(await db.query('select public.create_company_invitation($1,$2,$3,null,$4) id',[orgA,'invite-test@example.com',role,await hash(token)])).rows[0].id);
 const token='c'.repeat(64);await create(token);
 await assert.rejects(asUser(newUser,()=>db.query('select public.accept_company_invitation($1)',[token])));
 await db.query('update auth.users set email_confirmed_at=now() where id=$1',[newUser]);
 await assert.rejects(asUser(userA,()=>db.query('select public.accept_company_invitation($1)',[token])));
 const joined=await asUser(newUser,()=>db.query('select public.accept_company_invitation($1) id',[token]));assert.equal(joined.rows[0].id,orgA);
 await assert.rejects(asUser(newUser,()=>db.query('select public.accept_company_invitation($1)',[token])));
 const promote='d'.repeat(64);await create(promote,'admin');await asUser(newUser,()=>db.query('select public.accept_company_invitation($1)',[promote]));
 assert.equal((await db.query('select role from organization_members where user_id=$1 and organization_id=$2',[newUser,orgA])).rows[0].role,'viewer');
 const expired='e'.repeat(64),eid=await create(expired);await db.query("update organization_invitations set expires_at=now()-interval '1 day' where id=$1",[eid]);await assert.rejects(asUser(newUser,()=>db.query('select public.accept_company_invitation($1)',[expired])));
 const revoked='f'.repeat(64),rid=await create(revoked);await asUser(userA,()=>db.query('select public.revoke_company_invitation($1,$2)',[orgA,rid]));await assert.rejects(asUser(newUser,()=>db.query('select public.accept_company_invitation($1)',[revoked])));
 await assert.rejects(asUser(viewer,async()=>db.query('select public.create_company_invitation($1,$2,$3,null,$4)',[orgA,'x@example.com','member',await hash('a'.repeat(64))])));
 await assert.rejects(asUser(userA,async()=>db.query('select public.create_company_invitation($1,$2,$3,null,$4)',[orgA,'x@example.com','owner',await hash('b'.repeat(64))])));
 await assert.rejects(asUser(newUser,()=>db.query('select token_hash from organization_invitations')));
 await db.exec('set role anon');try{await assert.rejects(db.query('select public.accept_company_invitation($1)',[token]));}finally{await db.exec('reset role');}
});

const setupPayload = (name = 'Corretora A') => ({ name, administrator:'Ana Exemplo', email:'ana@example.com',legalName:'',cnpj:'',billingEmail:'',website:'',phone:'',areas:['treaty','facultative'],sectors:[],outlook:'',mailbox:'',senderEmail:'',evidence:[],reference:'',hasContacts:'',users:'',monthlyOffers:'',tools:'',pain:'',goal:'',step:1 });
async function saveSetup(org,payload,complete,revision) {
 return (await db.query('select public.save_company_onboarding($1,$2::jsonb,$3,$4) result',[org,JSON.stringify(payload),complete,revision])).rows[0].result;
}
let savedSetup;
test('onboarding saves resumable drafts and shares one line across several sectors', async () => {
 await asUser(userA,async () => {
  const payload=setupPayload();
  payload.sectors=[{name:'Planejamento',area:'treaty',lines:['Property','Engenharia']},{name:'Patrimonial',area:'facultative',lines:['property']}];
  savedSetup=await saveSetup(orgA,payload,false,0);
  assert.equal(savedSetup.revision,1); assert.equal(savedSetup.complete,false);
  assert.ok(savedSetup.payload.sectors.every(s=>s.id));
  assert.equal((await db.query('select * from business_lines where organization_id=$1',[orgA])).rows.length,2);
  assert.equal((await db.query('select * from department_business_lines where organization_id=$1',[orgA])).rows.length,3);
  const resumed=(await db.query('select payload,status,revision from company_profiles where organization_id=$1',[orgA])).rows[0];
  assert.deepEqual(resumed.payload,savedSetup.payload); assert.equal(resumed.status,'draft');
  const before=(await db.query('select count(*)::integer n from departments where organization_id=$1',[orgA])).rows[0].n;
  savedSetup=await saveSetup(orgA,savedSetup.payload,true,1);
  assert.equal(savedSetup.revision,2);
  assert.equal((await db.query('select count(*)::integer n from departments where organization_id=$1',[orgA])).rows[0].n,before);
  assert.equal((await db.query('select * from business_lines where organization_id=$1',[orgA])).rows.length,2);
 });
});
test('onboarding denies other companies, viewers, direct mutations and stale revisions',async () => {
 await asUser(userB,async () => {
  assert.equal((await db.query('select * from company_profiles')).rows.length,0);
  assert.equal((await db.query('select * from business_lines')).rows.length,0);
  await assert.rejects(saveSetup(orgA,setupPayload(),true,2),/Acesso negado/);
 });
 await asUser(viewer,async () => {
  assert.equal((await db.query('select * from company_profiles')).rows.length,0);
  assert.equal((await db.query('select * from business_lines')).rows.length,2);
  await assert.rejects(saveSetup(orgA,setupPayload(),true,2),/Acesso negado/);
  await assert.rejects(db.query("insert into business_lines(organization_id,name) values($1,'Intrusão')",[orgA]),/permission denied/);
 });
 await asUser(userA,async () => {
  await assert.rejects(db.query("update company_profiles set payload='{}'"),/permission denied/);
  await assert.rejects(saveSetup(orgA,setupPayload(),true,1),/Recarregue/);
  assert.equal((await db.query('select revision from company_profiles where organization_id=$1',[orgA])).rows[0].revision,2);
 });
 await db.exec('set role anon');
 try {await assert.rejects(saveSetup(orgA,setupPayload(),false,0),/permission denied/);}finally{await db.exec('reset role');}
});
test('invalid onboarding rolls back every change and existing sectors and records survive edits',async () => {
 const foreignDepartment=await asUser(userB,async () => (await db.query("insert into departments(organization_id,name,area) values($1,'Estrangeiro','other') returning id",[orgB])).rows[0].id);
 await asUser(userA,async () => {
  const invalid={...savedSetup.payload,name:'Nome que não deve persistir',sectors:[...savedSetup.payload.sectors,{id:foreignDepartment,name:'Estrangeiro',area:'other',lines:[]}]};
  await assert.rejects(saveSetup(orgA,invalid,true,2),/outra empresa/);
  assert.equal((await db.query('select name from organizations where id=$1',[orgA])).rows[0].name,'Corretora A');
  await assert.rejects(saveSetup(orgA,{...savedSetup.payload,email:'inválido'},true,2),/E-mail inválido/);
  await assert.rejects(saveSetup(orgA,{...savedSetup.payload,step:1.2},false,2),/Etapa inválida/);
  await assert.rejects(saveSetup(orgA,{...savedSetup.payload,secret:'credencial'},false,2),/Campo inválido/);
  await assert.rejects(saveSetup(orgA,{...savedSetup.payload,sectors:[{name:'Repetido',area:'other',lines:['Property','property']}]},true,2),/Linha repetida/);
  const count=(await db.query('select count(*)::integer n from departments where organization_id=$1',[orgA])).rows[0].n;
  const edited={...savedSetup.payload,sectors:[{...savedSetup.payload.sectors[0],name:'Planejamento revisado',lines:['Engenharia']}],billingEmail:'financeiro@example.com'};
  savedSetup=await saveSetup(orgA,edited,true,2);
  assert.equal((await db.query('select count(*)::integer n from departments where organization_id=$1',[orgA])).rows[0].n,count);
  assert.equal((await db.query('select * from contacts where id=$1',[contactA])).rows.length,1);
  assert.equal((await db.query('select * from operations where id=$1',[opA])).rows.length,1);
  assert.equal((await db.query('select * from department_business_lines where department_id=$1',[edited.sectors[0].id])).rows.length,1);
 });
});
test('minimal activation creates Geral once and administrators can manage company setup',async () => {
 const owner='00000000-0000-0000-0000-000000000901',admin='00000000-0000-0000-0000-000000000902';
 await db.query('insert into auth.users(id) values($1),($2)',[owner,admin]);
 const org=await asUser(owner,async ()=>(await db.query("select public.create_organization('Piloto') id")).rows[0].id);
 await db.query("insert into organization_members(organization_id,user_id,role) values($1,$2,'admin')",[org,admin]);
 await asUser(admin,async ()=>{
  await assert.rejects(saveSetup(org,{...setupPayload('Piloto'),administrator:''},true,0),/responsável/);
  const result=await saveSetup(org,setupPayload('Piloto'),true,0);
  assert.equal(result.payload.sectors[0].name,'Geral');
  await saveSetup(org,result.payload,true,1);
  assert.equal((await db.query('select * from departments where organization_id=$1',[org])).rows.length,1);
  assert.equal((await db.query('select status from company_profiles where organization_id=$1',[org])).rows[0].status,'complete');
 });
});

async function saveProposalRecord(org,changes={}) {
 const p={id:null,revision:0,reference:'PORTAL-001',title:'Proposta de teste',cedent:'Cedente de teste',contract:'',kind:'new_business',insured:'Risco fictício',department:null,line:null,prior:null,start:'2026-11-01',end:'2027-10-31',due:'2026-10-20',next:'Revisar condições',stage:'preparation',closure:'',...changes};
 return (await db.query('select public.save_proposal($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) id',[org,p.id,p.revision,p.reference,p.title,p.cedent,p.contract,p.kind,p.insured,p.department,p.line,p.prior,p.start,p.end,p.due,p.next,p.stage,p.closure])).rows[0].id;
}
let portalProposal;
test('proposals exist before contacts/offers, retain stage history and reject invalid dates and closure',async()=>{
 await asUser(userA,async()=>{
  portalProposal=await saveProposalRecord(orgA);
  assert.equal((await db.query('select * from offers where operation_id=$1',[portalProposal])).rows.length,0);
  const p=(await db.query('select * from operations where id=$1',[portalProposal])).rows[0];
  assert.equal(p.business_kind,'new_business');assert.equal(p.stage,'preparation');assert.equal(p.proposal_revision,0);
  await assert.rejects(saveProposalRecord(orgA,{reference:'BAD-DATE',start:'2027-01-01',end:'2026-01-01'}),/operation_coverage/);
  await assert.rejects(saveProposalRecord(orgA,{id:portalProposal,stage:'placed',closure:''}),/encerramento/);
  await saveProposalRecord(orgA,{id:portalProposal,stage:'market'});
  assert.equal((await db.query('select status from operations where id=$1',[portalProposal])).rows[0].status,'open');
  const events=(await db.query('select * from proposal_events where operation_id=$1 order by created_at',[portalProposal])).rows;
  assert.equal(events.length,2);assert.equal(events[1].event_type,'stage_changed');assert.equal(events[1].details_before.stage,'preparation');assert.equal(events[1].details_after.stage,'market');
  await assert.rejects(saveProposalRecord(orgA,{id:portalProposal,revision:0,stage:'negotiation'}),/Recarregue/);
  await assert.rejects(db.query('update proposal_events set note=\'forjado\''),/permission denied/);
 });
});
test('renewals link previous processes without copying sends, prevent cross-company links and cycles',async()=>{
 const other=await asUser(userB,()=>saveProposalRecord(orgB,{reference:'FOREIGN-PROP'}));
 await asUser(userB,()=>saveSetup(orgB,{...setupPayload('Corretora B'),sectors:[{name:'Setor B',area:'other',lines:['Linha B']}]},true,0));
 const lineId=(await db.query('select id from business_lines where organization_id=$1',[orgB])).rows[0].id;
 await asUser(userA,async()=>{
  const renewal=await saveProposalRecord(orgA,{reference:'RENEW-001',kind:'renewal',prior:portalProposal});
  assert.equal((await db.query('select * from offers where operation_id=$1',[renewal])).rows.length,0);
  assert.equal((await db.query('select prior_operation_id from operations where id=$1',[renewal])).rows[0].prior_operation_id,portalProposal);
  await assert.rejects(saveProposalRecord(orgA,{reference:'FOREIGN-RENEW',kind:'renewal',prior:other}),/foreign key/);
  await assert.rejects(saveProposalRecord(orgA,{id:portalProposal,revision:1,kind:'renewal',prior:renewal}),/Ciclo/);
  await assert.rejects(saveProposalRecord(orgA,{id:renewal,kind:'renewal',prior:renewal}),/Ciclo|operation_prior_not_self/);
  await assert.rejects(saveProposalRecord(orgA,{reference:'FOREIGN-LINE',line:lineId}),/foreign key/);
 });
});
test('new offer versions append snapshots to the same proposal atomically and never send automatically',async()=>{
 await asUser(userA,async()=>{
  const op=await saveProposalRecord(orgA,{reference:'VERSION-PROP'});
  await db.query('select prepare_proposal_offer($1,$2,null,null,$3,$4,$5,$6)',[orgA,op,'Assunto v1','Texto v1','',[contactA]]);
  const offer=(await db.query('select id from offers where operation_id=$1',[op])).rows[0].id;
  await db.query('select prepare_proposal_offer($1,$2,$3,null,$4,$5,$6,$7)',[orgA,op,offer,'Assunto v2','Texto v2','',[contactA]]);
  const versions=(await db.query('select version,body from offer_versions where offer_id=$1 order by version',[offer])).rows;
  assert.deepEqual(versions,[{version:1,body:'Texto v1'},{version:2,body:'Texto v2'}]);
  assert.equal((await db.query('select stage from operations where id=$1',[op])).rows[0].stage,'review');
  const recipient=(await db.query('select r.id from offer_recipients r join offer_versions v on v.id=r.offer_version_id where v.offer_id=$1 order by v.version limit 1',[offer])).rows[0].id;
  await db.query("update offer_recipients set status='sent_confirmed',sent_at=now() where id=$1",[recipient]);
  assert.equal((await db.query("select count(*)::integer n from proposal_events where operation_id=$1 and event_type='send_recorded'",[op])).rows[0].n,1);
  assert.equal((await db.query('select count(*)::integer n from offer_recipients r join offer_versions v on v.id=r.offer_version_id where v.offer_id=$1 and r.sent_at is null',[offer])).rows[0].n,1);
  await assert.rejects(db.query('select prepare_proposal_offer($1,$2,$3,null,$4,$5,$6,$7)',[orgA,op,offer,'Inválido','Texto','',[contactA,contactA]]),/Destinatário/);
  await assert.rejects(db.query('select prepare_proposal_offer($1,$2,$3,null,$4,$5,$6,$7)',[orgA,op,offer,'{{pendente}}','Texto','',[contactA]]),/Oferta inválida/);
  assert.equal((await db.query('select * from offer_versions where offer_id=$1',[offer])).rows.length,2);
  await saveProposalRecord(orgA,{id:op,reference:'VERSION-PROP',revision:1,stage:'not_placed',closure:'Decisão operacional de teste'});
  await assert.rejects(db.query('select prepare_proposal_offer($1,$2,$3,null,$4,$5,$6,$7)',[orgA,op,offer,'Nova','Texto','',[contactA]]),/encerrada/);
 });
});
test('proposal actions and event history keep company boundaries and viewer read-only permissions',async()=>{
 await asUser(userB,async()=>{
  assert.equal((await db.query('select * from proposal_events where operation_id=$1',[portalProposal])).rows.length,0);
  await assert.rejects(saveProposalRecord(orgA,{reference:'FOREIGN-WRITE'}),/Acesso negado/);
 });
 await asUser(viewer,async()=>{
  assert.ok((await db.query('select * from proposal_events where operation_id=$1',[portalProposal])).rows.length>0);
  await assert.rejects(saveProposalRecord(orgA,{reference:'VIEWER-WRITE'}),/Acesso negado/);
  await assert.rejects(db.query('select prepare_proposal_offer($1,$2,null,null,$3,$4,$5,$6)',[orgA,portalProposal,'Texto','Texto','',[contactA]]),/Acesso negado/);
 });
});
test('responses require an uploaded original and preserve classification history without closing proposal',async()=>{
 await asUser(userA,async()=>{
  await db.query('select prepare_proposal_offer($1,$2,null,null,$3,$4,$5,$6)',[orgA,portalProposal,'Oferta teste','Texto','',[contactA]]);
  const recipient=(await db.query('select r.id from offer_recipients r join offer_versions v on v.id=r.offer_version_id join offers f on f.id=v.offer_id where f.operation_id=$1',[portalProposal])).rows[0].id;
  await assert.rejects(db.query("insert into responses(organization_id,recipient_id,classification) values($1,$2,'declined')",[orgA,recipient]),/upload/);
  const id='00000000-0000-4000-8000-000000000955',path=`${orgA}/${portalProposal}/${id}`;
  await db.query("insert into documents(id,organization_id,operation_id,recipient_id,kind,original_name,storage_path,sha256,size_bytes,media_type) values($1,$2,$3,$4,'response','teste.eml',$5,$6,100,'message/rfc822')",[id,orgA,portalProposal,recipient,path,'f'.repeat(64)]);
  await assert.rejects(db.query("insert into responses(organization_id,recipient_id,document_id,classification) values($1,$2,$3,'accepted_total')",[orgA,recipient,id]),/upload/);
  await db.query("insert into storage.objects(bucket_id,name) values('operation-documents',$1)",[path]);
  const response=(await db.query("insert into responses(organization_id,recipient_id,document_id,classification) values($1,$2,$3,'information_request') returning id",[orgA,recipient,id])).rows[0].id;
  await db.query("update responses set classification='declined',note='Correção revisada' where id=$1",[response]);
  const events=(await db.query("select * from proposal_events where operation_id=$1 and event_type like 'response_%' order by created_at",[portalProposal])).rows;
  assert.equal(events.length,2);assert.equal(events[1].details_before.classification,'information_request');assert.equal(events[1].details_after.classification,'declined');
  assert.equal((await db.query('select stage from operations where id=$1',[portalProposal])).rows[0].stage,'market');
 });
});


test('portal migration preserves historical closure without inventing successful placement',async()=>{
 const legacy=(await db.query("select stage,status,closure_note,reference from operations where id='00000000-0000-4000-8000-000000000703'")).rows[0];
 assert.deepEqual(legacy,{stage:'closed',status:'closed',closure_note:'',reference:'LEGACY-CLOSED'});
 await asUser(userA,async()=>assert.equal((await db.query("select * from operations where id='00000000-0000-4000-8000-000000000703'")).rows.length,0));
});
