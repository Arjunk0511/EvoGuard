// Stop the gateway before running this recovery export. Source state is left unchanged.
const fs=require('node:fs/promises');
const path=require('node:path');
const {DatasetStore,quality}=require('./store.cjs');
const root=process.env.EVOGUARD_DATASET_DIR || path.join(__dirname,'..','intelligence_service','datasets','evoguard_behavior','evoguard_pilot_v1');
(async()=>{
 const store=new DatasetStore(root);
 let names;try{names=await fs.readdir(path.join(root,'state'));}catch(e){if(e.code==='ENOENT'){console.log('No recovery state found.');return;}throw e;}
 let n=0;
 for(const name of names.filter(n=>n.endsWith('.json'))){
  const state=await store.read(name.slice(0,-5));
  if(state.session.status==='complete')continue;
  const s=state.session;
  s.status='incomplete';s.end_reason=s.end_reason || 'unknown';s.integrity.acknowledged_complete=false;
  s.quality=quality(s,s.quality.client_counters);await store.export(state);n++;
 }
 console.log(`Exported ${n} incomplete session(s) from acknowledged state. Missing client events cannot be recovered.`);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
