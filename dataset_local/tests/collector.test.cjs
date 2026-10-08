const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {randomUUID}=require('node:crypto');
const {DatasetStore}=require('../store.cjs');
const frontend=path.join(__dirname,'..','public');
let loaded;
async function modules() {
 if(!loaded) {
  const helper=await fs.readFile(path.join(frontend,'behavioralSession.js'),'utf8');
  const uri='data:text/javascript;base64,'+Buffer.from(helper).toString('base64');
  const core=(await fs.readFile(path.join(frontend,'behavioralRecorder.js'),'utf8')).replace("'./behavioralSession.js'",JSON.stringify(uri));
  loaded={...(await import(uri)),...(await import('data:text/javascript;base64,'+Buffer.from(core).toString('base64')))};
 }
 return loaded;
}
class Target {
 constructor(){this.handlers=new Map();}
 addEventListener(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name).add(fn);}
 removeEventListener(name,fn){this.handlers.get(name)?.delete(fn);}
 fire(name,event={}){for(const fn of [...(this.handlers.get(name)||[])])fn(event);}
 count(){return [...this.handlers.values()].reduce((n,s)=>n+s.size,0);}
}
function element({editable=false,approved=false,control=false}={}) {
 return {nodeType:1,closest(selector){if(selector==='[data-evoguard-control]')return control?this:null;return editable?this:null;},matches(){return approved;},getAttribute(name){return name==='autocomplete'?'off':null;}};
}
async function setup(t,wrapper) {
 const win=new Target(),doc=new Target();
 Object.assign(win,{crypto:{randomUUID},location:{pathname:'/products'},innerWidth:1366,innerHeight:768,scrollX:0,scrollY:0});
 Object.assign(doc,{hidden:false,hasFocus:()=>true,activeElement:element()});
 global.window=win;global.document=doc;
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'evoguard-collector-'));
 const store=new DatasetStore(root),m=await modules();
 const request=async(route,payload)=>{
  if(route==='/start')return store.start(payload);
  if(route==='/batch')return store.batch(payload);
  if(route==='/finish')return store.finish(payload);
  return store.raw(route.split('/').pop());
 };
 const recorder=new m.BehavioralRecorder(()=>{},wrapper?wrapper(request):request);
 t.after(async()=>{recorder.destroy();await fs.rm(root,{recursive:true,force:true});});
 await recorder.start('user01','mouse',true);
 return {recorder,store,win,doc,m};
}
test('collector-to-store preserves mouse/button events and complete totals',async t=>{
 const {recorder,store}=await setup(t);
 const target=element();recorder.mouse('mousemove',{target,clientX:50,clientY:60});
 recorder.mouse('mousedown',{target,clientX:50,clientY:60,button:0});
 recorder.mouse('mouseup',{target,clientX:50,clientY:60,button:0});
 await recorder.stop();assert.equal(recorder.state,'saved');
 const raw=await store.raw(recorder.meta.session_id);
 assert.equal(raw.events.length,recorder.acknowledged);assert.equal(raw.events[1].button,0);assert.equal(raw.events[0].x,50);
});
test('rapid movement is throttled; button events are not',async t=>{
 const {recorder}=await setup(t);const target=element();
 for(let n=0;n<10;n++)recorder.mouse('mousemove',{target,clientX:n,clientY:n});
 for(let n=0;n<3;n++)recorder.mouse('click',{target,clientX:n,clientY:n,button:0});
 assert.equal(recorder.queue.filter(e=>e.type==='mousemove').length,1);
 assert.equal(recorder.queue.filter(e=>e.type==='click').length,3);
});
test('overlapping keys retain pairing without serializing physical codes or typed content',async t=>{
 const {recorder,store,doc}=await setup(t);const target=element({editable:true,approved:true});doc.activeElement=target;
 recorder.keyboard('keydown',{target,code:'KeyA',key:'a'});recorder.keyboard('keydown',{target,code:'KeyB',key:'b'});
 recorder.keyboard('keydown',{target,code:'KeyA',repeat:true});
 recorder.keyboard('keyup',{target,code:'KeyA'});recorder.keyboard('keyup',{target,code:'KeyB'});
 await recorder.stop();const raw=await store.raw(recorder.meta.session_id),events=raw.events;
 assert.equal(events.length,4);assert.equal(events[0].press_id,events[2].press_id);assert.notEqual(events[0].press_id,events[1].press_id);
 assert.equal(raw.quality.client_counters.key_repeat_ignored,1);assert.ok(!JSON.stringify(raw).includes('KeyA'));assert.ok(!('code' in events[0]));assert.ok(!('key' in events[0]));
});
test('unapproved input pauses mouse and keyboard interaction',async t=>{
 const {recorder,doc}=await setup(t);const target=element({editable:true});doc.activeElement=target;
 recorder.keyboard('keydown',{target,code:'KeyP'});recorder.mouse('mousemove',{target,clientX:4,clientY:5});
 assert.equal(recorder.paused,true);assert.deepEqual(recorder.queue.map(e=>e.type),['capturepause']);
 doc.activeElement=element();recorder.syncPrivacy();assert.equal(recorder.queue[1].type,'captureresume');
});
test('same-template navigation emits a boundary without storing route content',async t=>{
 const {recorder,win}=await setup(t);win.location.pathname='/product/private-id-one';recorder.contextChanged();
 win.location.pathname='/product/private-id-two';recorder.contextChanged();
 assert.equal(recorder.queue.filter(e=>e.type==='contextchange').length,2);assert.ok(!JSON.stringify(recorder.queue).includes('private-id'));
});
test('network acknowledgement loss retains batch and retry avoids duplicate data',async t=>{
 let lost=false;
 const {recorder,store}=await setup(t,send=>async(route,payload)=>{
  const ack=await send(route,payload);
  if(route==='/batch' && !lost){lost=true;throw new Error('Simulated response loss after commit');}
  return ack;
 });
 recorder.mouse('mousemove',{target:element(),clientX:2,clientY:4});
 await recorder.stop();assert.equal(recorder.state,'save_failed');assert.ok(recorder.pending);
 await recorder.retry();assert.equal(recorder.state,'saved');assert.equal((await store.raw(recorder.meta.session_id)).events.length,1);
});
test('recording resumes only after a valid Start acknowledgement',async t=>{
 let fail=true;
 const {recorder}=await setup(t,send=>async(route,payload)=>{if(route==='/start' && fail){fail=false;throw new Error('offline');}return send(route,payload);});
 assert.equal(recorder.state,'start_failed');assert.equal(recorder.recording,false);
 await recorder.retry();assert.equal(recorder.recording,true);
});
test('Stop removes capture listeners; teardown also removes exit guard',async t=>{
 const {recorder,win,doc}=await setup(t);assert.ok(win.count()>1);await recorder.stop();
 assert.equal(win.count(),1);assert.equal(doc.count(),0);recorder.destroy();assert.equal(win.count(),0);
});
test('hidden state and composition do not leak keystrokes',async t=>{
 const {recorder,doc}=await setup(t);const target=element({editable:true,approved:true});doc.activeElement=target;
 recorder.keyboard('keydown',{target,code:'KeyA',isComposing:true});assert.equal(recorder.total,0);assert.equal(recorder.counters.composition_events_ignored,1);
 doc.hidden=true;doc.fire('visibilitychange');recorder.keyboard('keydown',{target,code:'KeyA'});
 assert.ok(!recorder.queue.some(e=>e.type==='keydown'));
});
test('Finish response loss can be retried without changing the final payload',async t=>{
 let lost=false;
 const {recorder,store}=await setup(t,send=>async(route,payload)=>{const ack=await send(route,payload);if(route==='/finish'&&!lost){lost=true;throw new Error('Finish response lost');}return ack;});
 await recorder.stop();assert.equal(recorder.state,'save_failed');await recorder.retry();assert.equal(recorder.state,'saved');assert.equal((await store.raw(recorder.meta.session_id)).status,'complete');
});
test('privacy helper sanitizes search and reset URLs; numpad operators are not numbers',async()=>{
 const m=await modules();assert.equal(m.safePage('/products/private-text'),'/products/:keyword');assert.equal(m.safePage('/password/reset/secret-token'),'restricted');
 assert.equal(m.keyCategory('NumpadAdd'),'SPECIAL');assert.equal(m.keyCategory('NumpadEnter'),'ENTER');
});
