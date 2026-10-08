const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {DatasetStore,SETTINGS,validateEvent}=require('../store.cjs');
const start=()=>({schema_version:'2.0',dataset_version:'evoguard_pilot_v1',collector_version:'custom_collector_2.0.0',session_id:randomUUID(),participant_id:'user01',behavior_label:'human',data_origin:'human_browser',protocol_version:'evomart_tasks_v1',consent:{status:'granted',notice_version:'behavior_notice_v1'},input_device:'mouse',timestamp_unit:'milliseconds',started_at:new Date().toISOString(),capture_settings:{...SETTINGS},initial_context:{page:'/products',viewport_width:1366,viewport_height:768,focused:true,visible:true}});
const event=(seq,timestamp=seq*25,extra={})=>({seq,type:'mousemove',timestamp,x:seq*10,y:20,button:null,key_category:null,press_id:null,scroll_x:null,scroll_y:null,page:'/products',viewport_width:1366,viewport_height:768,visible:null,...extra});
const batch=(meta,events,batch_seq=0)=>({schema_version:'2.0',session_id:meta.session_id,batch_seq,events});
const finish=(meta,count,last=0,extra={})=>({schema_version:'2.0',session_id:meta.session_id,final_batch_seq:last,event_count:count,duration_ms:1000,ended_at:new Date().toISOString(),end_reason:'user_stop',client_counters:{key_repeat_ignored:0,unmatched_keyup_ignored:0,composition_events_ignored:0,dropped_events:0},...extra});
async function setup(t) {const root=await fs.mkdtemp(path.join(os.tmpdir(),'evoguard-test-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const store=new DatasetStore(root),m=start();await store.start(m);return {root,store,m};}

test('complete raw JSON preserves input events and reports exact totals',async t=>{
 const {root,store,m}=await setup(t);const events=[event(0,0),event(1,25)];
 await store.batch(batch(m,events));const ack=await store.finish(finish(m,2));
 assert.equal(ack.status,'complete');const raw=JSON.parse(await fs.readFile(path.join(root,ack.raw_path),'utf8'));
 assert.deepEqual(raw.events,events);assert.equal(raw.integrity.event_count,2);assert.equal(raw.schema_version,'2.0');
});
test('identical concurrent/restarted retries do not duplicate events',async t=>{
 const {root,store,m}=await setup(t);const b=batch(m,[event(0)]);
 const result=await Promise.all([store.batch(b),store.batch(b)]);
 assert.deepEqual(result.map(r=>r.duplicate),[false,true]);
 const restarted=new DatasetStore(root);assert.equal((await restarted.batch(b)).duplicate,true);
 assert.equal((await restarted.read(m.session_id)).session.events.length,1);
});
test('conflicting retry and noncontiguous batches are rejected',async t=>{
 const {store,m}=await setup(t);await store.batch(batch(m,[event(0)]));
 await assert.rejects(store.batch(batch(m,[event(0,5)])),/conflict/);
 await assert.rejects(store.batch(batch(m,[event(1)],2)),/sequence/);
});
test('unknown fields, typed key identifiers and invalid units are rejected',async t=>{
 const {store,m}=await setup(t);
 await assert.rejects(store.batch(batch(m,[{...event(0),code:'KeyA'}])),/fields/);
 await assert.rejects(store.batch(batch(m,[event(0,'25')])),/timestamp/);
 await assert.rejects(store.start({...start(),timestamp_unit:'seconds'}),/timestamp unit/);
 await assert.rejects(store.start({...start(),participant_id:['user01']}),/anonymous/);
});
test('invalid batch is atomic; equal timestamps are retained',async t=>{
 const {store,m}=await setup(t);
 await assert.rejects(store.batch(batch(m,[event(0,20),event(1,10)])),/timestamp/);
 assert.equal((await store.read(m.session_id)).session.events.length,0);
 await store.batch(batch(m,[event(0,20),event(1,20)]));
 const r=await store.finish(finish(m,2));assert.equal(r.quality.equal_timestamp_count,1);
});
test('privacy fields and restricted route interactions are rejected',()=>{
 assert.throws(()=>validateEvent(event(0,0,{page:'/products/secret-search'}),0,0),/sanitized/);
 assert.throws(()=>validateEvent(event(0,0,{page:'restricted'}),0,0),/restricted/);
 assert.throws(()=>validateEvent(event(0,0,{button:0}),0,0),/button/);
});
test('Start is idempotent and rejects a changed participant',async t=>{
 const {store,m}=await setup(t);assert.equal((await store.start(m)).duplicate,true);
 await assert.rejects(store.start({...m,participant_id:'user02'}),/conflict/);
});
test('finish requires matching totals and is idempotent after restart',async t=>{
 const {store,root,m}=await setup(t);await store.batch(batch(m,[event(0,50)]));
 await assert.rejects(store.finish(finish(m,2)),/totals/);
 await assert.rejects(store.finish(finish(m,1,0,{duration_ms:40})),/duration/);
 const f=finish(m,1);await store.finish(f);const restarted=new DatasetStore(root);
 assert.equal((await restarted.finish(f)).status,'complete');
 await assert.rejects(restarted.batch(batch(m,[event(1,60)],1)),/closed/);
});
test('missing modality is flagged instead of inventing keyboard data',async t=>{
 const {store,m}=await setup(t);await store.batch(batch(m,[event(0)]));
 const r=await store.finish(finish(m,1));assert.ok(r.quality.flags.includes('no_keyboard_pairs'));
});
test('overlapping same-category keys pair using press IDs',async t=>{
 const {store,m}=await setup(t);const key=(seq,t,type,press_id)=>event(seq,t,{type,x:null,y:null,key_category:'LETTER',press_id});
 await store.batch(batch(m,[key(0,0,'keydown','p000001'),key(1,10,'keydown','p000002'),key(2,30,'keyup','p000001'),key(3,50,'keyup','p000002')]));
 const r=await store.finish(finish(m,4));assert.equal(r.quality.unmatched_keydown_count,0);assert.ok(!r.quality.flags.includes('no_keyboard_pairs'));
});
test('context boundaries preserve incomplete key pairs as quality findings',async t=>{
 const {store,m}=await setup(t);
 await store.batch(batch(m,[event(0,0,{type:'keydown',x:null,y:null,key_category:'LETTER',press_id:'p000001'}),event(1,10,{type:'contextchange',x:null,y:null})]));
 assert.ok((await store.finish(finish(m,2))).quality.flags.includes('unmatched_keys'));
});
test('interrupted sessions are saved as incomplete',async t=>{
 const {store,m}=await setup(t);await store.batch(batch(m,[event(0)]));
 const r=await store.finish(finish(m,1,0,{end_reason:'error'}));assert.equal(r.status,'incomplete');
 assert.equal((await store.raw(m.session_id)).integrity.acknowledged_complete,false);
});
test('empty completed transport is flagged and retained',async t=>{
 const {store,m}=await setup(t);const r=await store.finish(finish(m,0,-1));
 assert.ok(r.quality.flags.includes('no_events'));assert.equal(r.event_count,0);
});
test('path traversal and invalid identifiers cannot become filenames',async t=>{
 const {store}=await setup(t);await assert.rejects(store.raw('../../outside'),/session_id/);
 await assert.rejects(store.start({...start(),participant_id:'../../bad'}),/anonymous/);
});
