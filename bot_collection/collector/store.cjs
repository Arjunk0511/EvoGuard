'use strict';
// Local pilot storage. One gateway process per dataset directory.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const TYPES = ['mousemove', 'mousedown', 'mouseup', 'click', 'scroll', 'keydown', 'keyup', 'focus', 'blur', 'visibilitychange', 'capturepause', 'captureresume', 'contextchange'];
const CATEGORIES = ['LETTER','NUMBER','SPACE','ENTER','BACKSPACE','TAB','SHIFT','CONTROL','ALT','ARROW','ESCAPE','DELETE','SPECIAL','UNKNOWN'];
const PAGES = ['/','/products','/products/:keyword','/product/:id','/cart','/data-collection','restricted','other'];
const SETTINGS = { mousemove_interval_ms:25, scroll_interval_ms:25, keyboard_policy:'allowlisted_non_sensitive', coordinate_unit:'css_pixels', scroll_mode:'document_absolute' };
const COUNTERS = ['key_repeat_ignored','unmatched_keyup_ignored','composition_events_ignored','dropped_events'];
const EVENT_KEYS = ['seq','type','timestamp','x','y','button','key_category','press_id','scroll_x','scroll_y','page','viewport_width','viewport_height','visible'];
const START_KEYS = ['schema_version','dataset_version','collector_version','session_id','participant_id','behavior_label','data_origin','protocol_version','consent','input_device','timestamp_unit','started_at','capture_settings','initial_context'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(message, status=400) { const e = new Error(message); e.status = status; throw e; }
function object(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function exact(v, keys, label) {
  if (!object(v) || keys.some(k => !Object.prototype.hasOwnProperty.call(v,k)) || Object.keys(v).some(k => !keys.includes(k))) fail(`${label}: fields must be exactly ${keys.join(', ')}`);
}
function finite(v, min=0, max=1e12) { return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max; }
function integer(v, min=0, max=Number.MAX_SAFE_INTEGER) { return Number.isInteger(v) && v >= min && v <= max; }
function iso(v) { return typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v; }
function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (object(v)) return '{' + Object.keys(v).sort().map(k => JSON.stringify(k)+':'+canonical(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
function digest(v) { return crypto.createHash('sha256').update(canonical(v)).digest('hex'); }
function id(v) { if (typeof v !== 'string' || !UUID.test(v)) fail('Invalid session_id'); }
function context(v) {
  if (!PAGES.includes(v.page) || !integer(v.viewport_width,1,32768) || !integer(v.viewport_height,1,32768)) fail('Invalid sanitized page or viewport');
}
function validateStart(m) {
  exact(m, START_KEYS, 'start'); id(m.session_id);
  if (m.schema_version !== '2.0' || m.dataset_version !== 'evoguard_bot_v1' || !['custom_collector_2.0.0','custom_collector_2.0.1'].includes(m.collector_version) || !['evomart_tasks_v1','evomart_local_tasks_v1'].includes(m.protocol_version) || m.timestamp_unit !== 'milliseconds') fail('Unsupported schema/dataset/collector/protocol or timestamp unit');
  // Isolated automation collector: reject human provenance.
  if (typeof m.participant_id !== 'string' || !/^user\d{2,4}$/.test(m.participant_id) || m.behavior_label !== 'bot' || m.data_origin !== 'playwright_browser') fail('Automation collector requires bot provenance and a compatible run ID');
  exact(m.consent,['status','notice_version'],'consent');
  if (m.consent.status !== 'not_applicable' || m.consent.notice_version !== 'automation_notice_v1') fail('Automation notice metadata is required');
  if (!['mouse','touchpad','unknown'].includes(m.input_device) || !iso(m.started_at)) fail('Invalid device or started_at');
  if (canonical(m.capture_settings) !== canonical(SETTINGS)) fail('Unsupported capture settings');
  exact(m.initial_context,['page','viewport_width','viewport_height','focused','visible'],'initial_context'); context(m.initial_context);
  if (typeof m.initial_context.focused !== 'boolean' || typeof m.initial_context.visible !== 'boolean') fail('Invalid initial focus/visibility');
}
function validateEvent(e, expectedSeq, previousTime) {
  exact(e, EVENT_KEYS, `event ${expectedSeq}`);
  if (!TYPES.includes(e.type) || e.seq !== expectedSeq || !finite(e.timestamp) || e.timestamp < previousTime) fail(`event ${expectedSeq}: invalid type, sequence or timestamp`);
  context(e);
  const mouse = ['mousemove','mousedown','mouseup','click'].includes(e.type);
  const key = ['keydown','keyup'].includes(e.type);
  if (mouse ? !finite(e.x,-1e6,1e6) || !finite(e.y,-1e6,1e6) : e.x !== null || e.y !== null) fail(`event ${expectedSeq}: invalid coordinates`);
  if (['mousedown','mouseup','click'].includes(e.type) ? !integer(e.button,0,4) : e.button !== null) fail(`event ${expectedSeq}: invalid button`);
  if (key ? !CATEGORIES.includes(e.key_category) || (typeof e.press_id !== 'string' || !/^p\d{6,10}$/.test(e.press_id)) : e.key_category !== null || e.press_id !== null) fail(`event ${expectedSeq}: invalid key pairing`);
  if (e.type === 'scroll' ? !finite(e.scroll_x,-1e8,1e8) || !finite(e.scroll_y,-1e8,1e8) : e.scroll_x !== null || e.scroll_y !== null) fail(`event ${expectedSeq}: invalid scroll offsets`);
  if (e.type === 'visibilitychange' ? typeof e.visible !== 'boolean' : e.visible !== null) fail(`event ${expectedSeq}: invalid visibility`);
  if (['mousemove','mousedown','mouseup','click','scroll','keydown','keyup'].includes(e.type) && e.page === 'restricted') fail(`event ${expectedSeq}: interaction on restricted page`);
}
function quality(session, counters=null) {
  const counts = Object.fromEntries(TYPES.map(t => [t,0]));
  const keys = new Map(), buttons = new Set(), flags = new Set();
  let unmatchedKeys=0, unmatchedButtons=0, equal=0, pairs=0, previous=null;
  const clear = () => { unmatchedKeys+=keys.size; unmatchedButtons+=buttons.size; keys.clear(); buttons.clear(); };
  for (const e of session.events) {
    counts[e.type]++;
    if (previous === e.timestamp) equal++;
    previous=e.timestamp;
    if (e.x !== null && (e.x<0 || e.y<0 || e.x>e.viewport_width || e.y>e.viewport_height)) flags.add('outside_viewport');
    if (['blur','capturepause','contextchange'].includes(e.type) || (e.type==='visibilitychange' && !e.visible)) clear();
    if (e.type==='keydown') { if (keys.has(e.press_id)) { unmatchedKeys++; } keys.set(e.press_id,e); }
    if (e.type==='keyup') { const down=keys.get(e.press_id); if (down && down.key_category===e.key_category) {pairs++; keys.delete(e.press_id);} else flags.add('unmatched_keys'); }
    if (e.type==='mousedown') { if (buttons.has(e.button)) unmatchedButtons++; buttons.add(e.button); }
    if (e.type==='mouseup') { if (!buttons.delete(e.button)) flags.add('unmatched_buttons'); }
  }
  clear();
  if (!session.events.length) flags.add('no_events');
  if (!counts.mousemove) flags.add('no_mouse_movement');
  if (!pairs) flags.add('no_keyboard_pairs');
  if (unmatchedKeys) flags.add('unmatched_keys');
  if (unmatchedButtons) flags.add('unmatched_buttons');
  if (equal) flags.add('equal_timestamps');
  if (session.status!=='complete') flags.add('incomplete_session');
  if (counters && counters.dropped_events) flags.add('client_dropped_events');
  return {flags:[...flags].sort(),event_counts_by_type:counts,unmatched_keydown_count:unmatchedKeys,unmatched_mousedown_count:unmatchedButtons,equal_timestamp_count:equal,client_counters:counters};
}
async function atomic(file, data) {
  await fs.mkdir(path.dirname(file),{recursive:true});
  const tmp=file+'.'+crypto.randomUUID()+'.tmp';
  try {
    const h=await fs.open(tmp,'wx');
    try { await h.writeFile(JSON.stringify(data,null,2)+'\n'); await h.sync(); } finally { await h.close(); }
    await fs.rename(tmp,file);
  } finally { await fs.rm(tmp,{force:true}).catch(()=>{}); }
}
class DatasetStore {
  constructor(root) { this.root=root; this.locks=new Map(); }
  async locked(sessionId, action) {
    id(sessionId);
    const previous=this.locks.get(sessionId)||Promise.resolve();
    const next=previous.catch(()=>{}).then(action); this.locks.set(sessionId,next);
    try { return await next; } finally { if (this.locks.get(sessionId)===next) this.locks.delete(sessionId); }
  }
  statePath(sid) { return path.join(this.root,'state',sid+'.json'); }
  async read(sid) { try {return JSON.parse(await fs.readFile(this.statePath(sid),'utf8'));} catch(e) {if(e.code==='ENOENT') fail('Session not found',404); throw e;} }
  async save(sid,state) { await atomic(this.statePath(sid),state); }
  async export(state) {
    const s=state.session;
    const file=path.join(this.root,'raw',s.participant_id,s.session_id+'.json');
    await atomic(file,s); return file;
  }
  async start(m) {
    validateStart(m);
    return this.locked(m.session_id,async()=>{
      let prior;
      try {prior=await this.read(m.session_id);} catch(e) {if(e.status!==404) throw e;}
      if (prior) {if(prior.start_digest!==digest(m)) fail('Session metadata conflict',409); return {session_id:m.session_id,status:prior.session.status,duplicate:true};}
      const s={...m,ended_at:null,duration_ms:null,status:'recording',end_reason:null,events:[],integrity:{last_batch_seq:-1,event_count:0,acknowledged_complete:false},quality:null};
      s.quality=quality(s);
      await this.save(m.session_id,{start_digest:digest(m),batch_digests:[],finish_digest:null,session:s});
      return {session_id:m.session_id,status:'recording',duplicate:false};
    });
  }
  async batch(b) {
    exact(b,['schema_version','session_id','batch_seq','events'],'batch'); id(b.session_id);
    if(b.schema_version!=='2.0' || !integer(b.batch_seq) || !Array.isArray(b.events) || b.events.length<1 || b.events.length>100) fail('Invalid batch header/count');
    if(Buffer.byteLength(JSON.stringify(b),'utf8')>48*1024) fail('Batch exceeds 48 KiB',413);
    return this.locked(b.session_id,async()=>{
      const state=await this.read(b.session_id), s=state.session, hash=digest(b);
      const existing=state.batch_digests[b.batch_seq];
      if(existing) {
        if(existing.hash!==hash) fail('Batch content conflict',409);
        return {...existing.ack,duplicate:true};
      }
      if(s.status!=='recording') fail('Session is closed',409);
      if(b.batch_seq!==state.batch_digests.length) fail('Unexpected batch sequence',409);
      if(s.events.length+b.events.length>30000) fail('Pilot session limit: 30000 events',413);
      let prev=s.events.length?s.events[s.events.length-1].timestamp:0;
      b.events.forEach((e,i)=>{validateEvent(e,s.events.length+i,prev); prev=e.timestamp;});
      s.events.push(...b.events);
      const ack={session_id:b.session_id,batch_seq:b.batch_seq,accepted_event_count:b.events.length,last_event_seq:s.events.length-1,duplicate:false};
      state.batch_digests.push({hash,ack});
      s.integrity={last_batch_seq:b.batch_seq,event_count:s.events.length,acknowledged_complete:false}; s.quality=quality(s);
      await this.save(b.session_id,state); return ack;
    });
  }
  async finish(f) {
    exact(f,['schema_version','session_id','final_batch_seq','event_count','duration_ms','ended_at','end_reason','client_counters'],'finish'); id(f.session_id);
    if(f.schema_version!=='2.0' || !integer(f.final_batch_seq,-1) || !integer(f.event_count) || !finite(f.duration_ms) || !iso(f.ended_at) || !['user_stop','reload','page_exit','buffer_limit','error','unknown'].includes(f.end_reason)) fail('Invalid finish fields');
    exact(f.client_counters,COUNTERS,'client_counters');
    if(COUNTERS.some(k=>!integer(f.client_counters[k]))) fail('Invalid counters');
    return this.locked(f.session_id,async()=>{
      const state=await this.read(f.session_id),s=state.session,hash=digest(f);
      if(state.finish_digest && state.finish_digest!==hash) fail('Finish conflict',409);
      if(f.final_batch_seq!==s.integrity.last_batch_seq || f.event_count!==s.events.length || (s.events.length && f.duration_ms<s.events[s.events.length-1].timestamp)) fail('Finish totals or duration do not match stored events',409);
      if(!state.finish_digest) {
        s.status=f.end_reason==='user_stop' && f.client_counters.dropped_events===0?'complete':'incomplete';
        s.ended_at=f.ended_at;s.duration_ms=f.duration_ms;s.end_reason=f.end_reason;
        s.integrity.acknowledged_complete=s.status==='complete';s.quality=quality(s,f.client_counters);
        state.finish_digest=hash; await this.save(f.session_id,state);
      }
      // Re-export on retry to recover if export failed after the state commit.
      await this.export(state);
      return {session_id:f.session_id,status:s.status,event_count:s.events.length,quality:s.quality,raw_path:`raw/${s.participant_id}/${s.session_id}.json`};
    });
  }
  async raw(sid) {
    id(sid); const state=await this.read(sid);
    if(!state.finish_digest) fail('Recording not finalized; acknowledged batches are retained in state/',409);
    return state.session;
  }
}
module.exports={DatasetStore,validateStart,validateEvent,quality,TYPES,SETTINGS,canonical};
