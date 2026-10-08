import {createBehavioralSession,createBehavioralEvent,keyCategory,safePage} from './behavioralSession';

const API = (process.env.REACT_APP_EVOGUARD_GATEWAY_URL || 'http://localhost:5000').replace(/\/$/,'') + '/api/behavior/dataset/v2';
const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
export async function datasetRequest(route,payload) {
  let lastError;
  for(let attempt=0;attempt<3;attempt++) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(API+route,{method:payload?'POST':'GET',headers:payload?{'Content-Type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined,signal:controller.signal});
      const result=await response.json();
      if(!response.ok || !result.success) {
        const error=new Error(result.error || `Dataset server returned ${response.status}`);
        error.nonretryable=response.status>=400 && response.status<500; throw error;
      }
      return result.data;
    } catch(error) {
      lastError=error;
      if(error.nonretryable) throw error;
    } finally {clearTimeout(timer);}
    if(attempt<2) await sleep(400 * (2 ** attempt));
  }
  throw new Error(`Dataset server did not acknowledge the request. ${lastError.message}`);
}

// Owns recording independently of route components. No physical key identifier is serialized.
export class BehavioralRecorder {
  constructor(onUpdate=()=>{},request=datasetRequest) {
    this.onUpdate=onUpdate;this.request=request;this.state='idle';this.error='';
    this.listeners=[];this.queue=[];this.pending=null;this.pendingBytes=0;this.activeKeys=new Map();
    this.beforeExit=event=>{if(['starting','recording','saving','save_failed','start_failed'].includes(this.state)){event.preventDefault();event.returnValue='';}};
    this.recording=false;this.total=0;this.acknowledged=0;this.batchSeq=0;this.pressCounter=0;
    this.counters={key_repeat_ignored:0,unmatched_keyup_ignored:0,composition_events_ignored:0,dropped_events:0};
  }
  snapshot() {
    return {state:this.state,error:this.error,participant:this.meta?.participant_id || '',sessionId:this.meta?.session_id || '',total:this.total,acknowledged:this.acknowledged,paused:!!this.paused,elapsedMs:this.origin===undefined?0:(this.stopData?.duration_ms ?? performance.now()-this.origin),result:this.result || null};
  }
  publish() {this.onUpdate(this.snapshot());}
  async start(participant,device,consented) {
    if(!consented) throw new Error('Participant consent is required before recording.');
    if(!['idle','saved','incomplete'].includes(this.state)) return;
    if(!this.exitGuardAttached){window.addEventListener('beforeunload',this.beforeExit);this.exitGuardAttached=true;}
    this.detach();this.queue=[];this.pending=null;this.pendingBytes=0;this.total=0;this.acknowledged=0;this.batchSeq=0;this.pressCounter=0;this.activeKeys.clear();
    this.counters={key_repeat_ignored:0,unmatched_keyup_ignored:0,composition_events_ignored:0,dropped_events:0};
    this.stopData=null;this.result=null;this.error='';this.origin=performance.now();
    this.meta=createBehavioralSession(participant,device);this.state='starting';this.publish();
    await this.completeStart();
  }
  async completeStart() {
    try {
      const ack=await this.request('/start',this.meta);
      if(this.disposed)return;
      if(ack.session_id!==this.meta.session_id || ack.status!=='recording') throw new Error('Unexpected Start acknowledgement.');
      this.state='recording';this.recording=true;this.paused=false;this.focused=document.hasFocus();this.composing=false;
      this.lastMove=-Infinity;this.lastScroll=-Infinity;this.lastContext=this.contextSignature();this.attach();this.syncPrivacy();this.publish();
    } catch(error) {this.state='start_failed';this.error=error.message;this.publish();}
  }
  now() {return performance.now()-this.origin;}
  contextSignature() {return `${window.location.pathname}|${window.innerWidth}|${window.innerHeight}`;}
  node(el) {return el && el.nodeType===1?el:el?.parentElement;}
  control(el) {return !!this.node(el)?.closest('[data-evoguard-control]');}
  editable(el) {return !!this.node(el)?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])');}
  optedInput(el) {
    const input=this.node(el);
    return !!input && input.matches('input[data-evoguard-typing="true"][type="text"],input[data-evoguard-typing="true"][type="search"],textarea[data-evoguard-typing="true"]') && input.getAttribute('autocomplete')==='off' && safePage(window.location.pathname)!=='restricted' && !this.control(input);
  }
  blocked() {
    return !this.focused || document.hidden || safePage(window.location.pathname)==='restricted' || this.control(document.activeElement) || (this.editable(document.activeElement) && !this.optedInput(document.activeElement));
  }
  syncPrivacy() {
    if(!this.recording)return;
    const blocked=this.blocked();
    if(blocked!==this.paused) {
      this.paused=blocked;this.activeKeys.clear();
      this.emit(blocked?'capturepause':'captureresume',{},true);this.publish();
    }
  }
  contextChanged() {
    if(!this.recording)return;
    const context=this.contextSignature();
    if(!this.resizeTimer && context!==this.lastContext) {
      this.lastContext=context;this.activeKeys.clear();this.emit('contextchange',{},true);this.lastMove=-Infinity;this.lastScroll=-Infinity;
    }
    this.syncPrivacy();
  }
  emit(type,fields={},boundary=false) {
    if(!this.recording || (!boundary && this.paused))return;
    const event=createBehavioralEvent(this.total,type,this.now(),fields), size=bytes(event)+1;
    if(this.pendingBytes+size>5*1024*1024 || this.total>=30000) {
      this.counters.dropped_events++;
      this.stop('buffer_limit');return;
    }
    this.queue.push(event);this.total++;this.pendingBytes+=size;
    if(this.queue.length>=100) this.drain();
  }
  canInteract(event) {
    this.contextChanged();this.syncPrivacy();
    return this.recording && !this.paused && !this.resizeTimer && !this.control(event.target) && !(this.editable(event.target)&&!this.optedInput(event.target));
  }
  mouse(type,event) {
    if(!this.canInteract(event))return;
    if(type==='mousemove') {
      const time=this.now();if(time-this.lastMove<25)return;this.lastMove=time;
    }
    this.emit(type,{x:event.clientX,y:event.clientY,button:type==='mousemove'?null:event.button});
  }
  scroll(final=false) {
    if(!this.recording)return;
    this.contextChanged();
    if(this.paused || this.resizeTimer)return;
    const time=this.now();
    if(!final && time-this.lastScroll<25) {this.pendingScroll=true;return;}
    this.pendingScroll=false;this.lastScroll=time;
    this.emit('scroll',{scroll_x:window.scrollX,scroll_y:window.scrollY});
  }
  keyboard(type,event) {
    if(!this.canInteract(event) || !this.optedInput(event.target))return;
    if(event.isComposing || this.composing) {this.counters.composition_events_ignored++;return;}
    if(!event.code)return;
    if(type==='keydown') {
      if(event.repeat || this.activeKeys.has(event.code)) {this.counters.key_repeat_ignored++;return;}
      const pair={press_id:`p${String(++this.pressCounter).padStart(6,'0')}`,key_category:keyCategory(event.code)};
      this.activeKeys.set(event.code,pair);this.emit(type,pair);
    } else {
      const pair=this.activeKeys.get(event.code);
      if(!pair) {this.counters.unmatched_keyup_ignored++;return;}
      this.emit(type,pair);this.activeKeys.delete(event.code);
    }
  }
  listen(target,name,handler,options) {target.addEventListener(name,handler,options);this.listeners.push(()=>target.removeEventListener(name,handler,options));}
  attach() {
    for(const name of ['mousemove','mousedown','mouseup','click']) this.listen(window,name,event=>this.mouse(name,event),{passive:true});
    for(const name of ['keydown','keyup']) this.listen(window,name,event=>this.keyboard(name,event));
    this.listen(window,'scroll',()=>this.scroll(),{passive:true});
    this.listen(window,'focus',()=>{this.focused=true;this.emit('focus',{},true);this.syncPrivacy();});
    this.listen(window,'blur',()=>{this.emit('blur',{},true);this.focused=false;this.activeKeys.clear();this.syncPrivacy();});
    this.listen(document,'visibilitychange',()=>{this.emit('visibilitychange',{visible:!document.hidden},true);this.activeKeys.clear();this.syncPrivacy();});
    this.listen(document,'focusin',()=>this.syncPrivacy());
    this.listen(document,'focusout',()=>{this.activeKeys.clear();Promise.resolve().then(()=>this.syncPrivacy());});
    this.listen(document,'compositionstart',()=>{this.composing=true;this.activeKeys.clear();});
    this.listen(document,'compositionend',()=>{this.composing=false;this.activeKeys.clear();});
    this.listen(window,'resize',()=>{
      this.activeKeys.clear();clearTimeout(this.resizeTimer);
      this.resizeTimer=setTimeout(()=>{this.resizeTimer=null;this.contextChanged();},100);
    });
    this.listen(window,'pagehide',()=>{
      // Async completion is not reliable on exit. Leave acknowledged state recoverable, never claim complete.
      this.freeze('page_exit');this.state='save_failed';this.error='Page exit interrupted recording. Retry saving to retain this session as incomplete.';this.publish();
    });
    this.tick=setInterval(()=>{this.contextChanged();this.drain();this.publish();},1000);
  }
  detach() {this.listeners.splice(0).forEach(remove=>remove());clearInterval(this.tick);clearTimeout(this.resizeTimer);this.resizeTimer=null;}
  pack() {
    if(this.pending || !this.queue.length)return;
    const events=[];
    while(this.queue.length && events.length<100) {
      const next=this.queue[0];
      const trial={schema_version:'2.0',session_id:this.meta.session_id,batch_seq:this.batchSeq,events:[...events,next]};
      if(bytes(trial)>48*1024)break;
      events.push(this.queue.shift());
    }
    if(!events.length)throw new Error('A single event exceeds the batch byte limit.');
    this.pending={schema_version:'2.0',session_id:this.meta.session_id,batch_seq:this.batchSeq,events};
  }
  async drain() {
    if(this.inFlight)return this.inFlight;
    if(['start_failed','starting','save_failed'].includes(this.state))return;
    this.inFlight=this.sendQueued();
    try {await this.inFlight;} finally {this.inFlight=null;}
  }
  async sendQueued() {
    try {
      while(this.pending || this.queue.length) {
        this.pack();const payload=this.pending;
        const ack=await this.request('/batch',payload);
        if(ack.session_id!==payload.session_id || ack.batch_seq!==payload.batch_seq || ack.accepted_event_count!==payload.events.length || ack.last_event_seq!==payload.events[payload.events.length-1].seq) throw new Error('Batch acknowledgement totals do not match.');
        this.acknowledged+=payload.events.length;
        this.pendingBytes-=payload.events.reduce((n,e)=>n+bytes(e)+1,0);
        this.pending=null;this.batchSeq++;this.publish();
      }
    } catch(error) {
      if(!this.stopData)this.freeze('error');
      this.state='save_failed';this.error=error.message;this.publish();
    }
  }
  freeze(reason) {
    this.recording=false;this.detach();this.activeKeys.clear();
    this.stopData={duration_ms:this.now(),ended_at:new Date().toISOString(),end_reason:reason};
  }
  async stop(reason='user_stop') {
    if(!this.recording)return;
    if(this.pendingScroll)this.scroll(true);
    if(!this.recording)return;
    this.freeze(reason);this.state='saving';this.publish();
    await this.finishSave();
  }
  async finishSave() {
    await this.drain();
    if(this.state==='save_failed')return;
    try {
      const result=await this.request('/finish',{schema_version:'2.0',session_id:this.meta.session_id,final_batch_seq:this.batchSeq-1,event_count:this.total,...this.stopData,client_counters:{...this.counters}});
      if(result.session_id!==this.meta.session_id || result.event_count!==this.total || !['complete','incomplete'].includes(result.status)) throw new Error('Finish acknowledgement does not match.');
      this.result=result;this.state=result.status==='complete'?'saved':'incomplete';this.error='';this.publish();
    } catch(error) {this.state='save_failed';this.error=error.message;this.publish();}
  }
  async retry() {
    this.error='';
    if(this.state==='start_failed') {this.state='starting';this.publish();return this.completeStart();}
    if(this.state!=='save_failed')return;
    this.state='saving';this.publish();await this.finishSave();
  }
  async download() {
    if(!this.result)throw new Error('Finish saving this session before downloading.');
    const session=await this.request('/session/'+this.meta.session_id);
    const url=URL.createObjectURL(new Blob([JSON.stringify(session,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=this.meta.session_id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  destroy() {this.disposed=true;window.removeEventListener('beforeunload',this.beforeExit);this.recording=false;this.detach();this.activeKeys.clear();this.onUpdate=()=>{};}
}
