import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createIngestionHandler} from '../../supabase/functions/ingest-susep/handler.ts';
const token = 'a'.repeat(43); const hash = createHash('sha256').update(token).digest('hex');
const calls=[]; const handler=createIngestionHandler(hash,async (name,payload) => {calls.push({name,payload});return {data:'run-id',error:null};});
const request=(body,auth=token) => new Request('https://example.invalid',{method:'POST',headers:{Authorization:`Bearer ${auth}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('ingestion rejects missing/wrong token and user JWT before any privileged RPC', async () => {
  for (const auth of ['', 'b'.repeat(43),'eyJ.fake.userJWT']) {
    assert.equal((await handler(request({},auth))).status,401);
  }
  assert.equal(calls.length,0);
});
test('ingestion only dispatches the two public-data RPCs and rejects large/invalid payloads', async () => {
  assert.equal((await handler(request({function:'delete_all_contacts',payload:{}}))).status,400);
  assert.equal((await handler(request({function:'publish_susep_collection',payload:[]}))).status,400);
  assert.equal((await handler(request({data:'x'.repeat(2_000_001)}))).status,413);
  const response = await handler(request({function:'publish_susep_collection',payload:{p_run_key:'synthetic'}}));
  assert.equal(response.status,200);
  assert.deepEqual(calls,[{name:'publish_susep_collection',payload:{p_run_key:'synthetic'}}]);
});
