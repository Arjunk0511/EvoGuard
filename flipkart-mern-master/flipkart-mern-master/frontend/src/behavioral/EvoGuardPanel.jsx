import { useEffect, useState } from 'react';
import { startReferenceRecorder } from './referenceRecorder';

const API = process.env.REACT_APP_EVOGUARD_REFERENCE_URL || 'http://127.0.0.1:5006';
export default function EvoGuardPanel() {
  const [running,setRunning]=useState(false);
  const [result,setResult]=useState(null);
  const [status,setStatus]=useState('Ready');
  useEffect(()=>{
    if(!running)return undefined;
    let disposed=false, pending=false;
    const controllers=new Set();
    const stop=startReferenceRecorder(async payload=>{
      if(pending){setStatus('Window skipped: scorer is still busy.');return;}
      pending=true;setStatus('Comparing behavior…');
      const controller=new AbortController();controllers.add(controller);
      const timeout=setTimeout(()=>controller.abort(),8000);
      try {
        const response=await fetch(API+'/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        if(!response.ok)throw new Error('Scoring failed');
        const data=await response.json();
        if(!disposed){setResult(data);setStatus(data.status==='scored'?'Updated '+new Date().toLocaleTimeString():'Need more mouse activity and search-field typing.');}
      }catch(e){if(!disposed){setResult(null);setStatus('Scorer unavailable — start the Python service on port 5006.');}}
      finally{clearTimeout(timeout);controllers.delete(controller);pending=false;}
    },message=>{if(!disposed)setStatus(message);});
    return ()=>{disposed=true;stop();controllers.forEach(c=>c.abort());};
  },[running]);
  const scored=result && result.status==='scored';
  return <aside data-evoguard-panel style={{position:'fixed',bottom:16,right:16,zIndex:9999,width:310,padding:16,borderRadius:12,background:'#13243b',color:'#fff',boxShadow:'0 5px 24px #0005',fontFamily:'sans-serif',fontSize:13}}>
    <strong style={{fontSize:17}}>EvoGuard · Behavior monitor</strong>
    <p style={{margin:'8px 0'}}>Demo reference similarity · alerts only</p>
    <p>Records movement and search-key timing. No typed text or passwords.</p>
    <button onClick={()=>{setResult(null);setStatus(running?'Stopped':'Starting…');setRunning(!running);}} style={{background:running?'#dbe4ef':'#ffc640',color:'#13243b',padding:'8px 14px',borderRadius:6,border:0,cursor:'pointer'}}>{running?'Stop monitoring':'Start monitoring'}</button>
    <div aria-live="polite">
      <div style={{fontSize:30,marginTop:10}}>{scored?result.risk_score+' / 100':'—'}</div>
      <div>{scored?(result.comparison==='closer_to_bot'?'Closer to bot references':result.comparison==='closer_to_human'?'Closer to human references':'Similar distance to both'):'No current score'}</div>
      {scored && <div style={{marginTop:6}}>Nearest bot pattern: {result.closest_bot_pattern.replace(/_/g,' ')}</div>}
      {result && <div>Evidence: {result.evidence.mouse_pairs} mouse pairs · {result.evidence.key_pairs} key pairs</div>}
      <p style={{color:'#bdd1e8'}}>{status}</p>
    </div>
    <small>Similarity score, not accuracy or probability. No automatic blocking.</small>
  </aside>;
}
