const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {createServer}=require('../server.cjs');
const {SETTINGS}=require('../store.cjs');
async function setup(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'evoguard-http-')),server=createServer({root});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+server.address().port;
 const api=base+'/api/behavior/dataset/v2';
 const post=(route,payload,headers={})=>fetch(api+route,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)});
 return {base,api,post,root};
}
test('standalone HTTP serves task pages/modules and health without database dependencies',async t=>{
 const {base,api}=await setup(t);
 const health=await (await fetch(api+'/health')).json();assert.equal(health.mongo_required,false);
 for(const route of ['/','/data-collection','/products/headphones','/product/audio-01','/cart']){const r=await fetch(base+route);assert.equal(r.status,200);assert.ok((await r.text()).includes('/assets/app.js'));}
 for(const name of ['app.js','behavioralSession.js','behavioralRecorder.js','styles.css'])assert.equal((await fetch(base+'/assets/'+name)).status,200);
 const module=await(await fetch(base+'/assets/behavioralRecorder.js')).text();assert.ok(module.includes('window.location.origin'));assert.ok(!module.includes('process.env'));
 assert.equal((await fetch(base+'/state/private.json')).status,404);
});
test('real HTTP collection produces a canonical raw file with the local protocol',async t=>{
 const {post,api,root}=await setup(t);const sid=randomUUID();
 const m={schema_version:'2.0',dataset_version:'evoguard_pilot_v1',collector_version:'custom_collector_2.0.1',session_id:sid,participant_id:'user00',behavior_label:'human',data_origin:'human_browser',protocol_version:'evomart_local_tasks_v1',consent:{status:'granted',notice_version:'behavior_notice_v1'},input_device:'mouse',timestamp_unit:'milliseconds',started_at:new Date().toISOString(),capture_settings:SETTINGS,initial_context:{page:'/products',viewport_width:1366,viewport_height:768,focused:true,visible:true}};
 assert.equal((await post('/start',m)).status,200);
 const e={seq:0,type:'mousemove',timestamp:50,x:10,y:20,button:null,key_category:null,press_id:null,scroll_x:null,scroll_y:null,page:'/products',viewport_width:1366,viewport_height:768,visible:null};
 const b={schema_version:'2.0',session_id:sid,batch_seq:0,events:[e]};
 assert.equal((await post('/batch',b)).status,200);assert.equal((await(await post('/batch',b)).json()).data.duplicate,true);
 const f={schema_version:'2.0',session_id:sid,final_batch_seq:0,event_count:1,duration_ms:100,ended_at:new Date().toISOString(),end_reason:'user_stop',client_counters:{key_repeat_ignored:0,unmatched_keyup_ignored:0,composition_events_ignored:0,dropped_events:0}};
 assert.equal((await(await post('/finish',f)).json()).data.status,'complete');
 const raw=JSON.parse(await fs.readFile(path.join(root,'raw','user00',sid+'.json'),'utf8'));assert.deepEqual(raw.events,[e]);assert.equal(raw.protocol_version,'evomart_local_tasks_v1');
 assert.equal((await(await fetch(api+'/session/'+sid)).json()).data.events.length,1);
});
test('HTTP rejects cross-origin submissions, oversized bodies and malformed JSON',async t=>{
 const {post,api}=await setup(t);
 assert.equal((await post('/start',{}, {Origin:'https://unrelated.example'})).status,403);
 assert.equal((await post('/batch',{junk:'x'.repeat(50000)})).status,413);
 assert.equal((await fetch(api+'/start',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'})).status,400);
 assert.equal((await fetch(api+'/start',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'})).status,415);
});
