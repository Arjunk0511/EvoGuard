import {createContext,useContext,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {BehavioralRecorder} from './behavioralRecorder';

const CollectionContext=createContext(null);
export function useBehavioralCollection() {
  const value=useContext(CollectionContext);
  if(!value)throw new Error('Collection controls require BehavioralCollector above the routes.');
  return value;
}
export default function BehavioralCollector({children}) {
  const [snapshot,setSnapshot]=useState({state:'idle',total:0,acknowledged:0,elapsedMs:0});
  const recorderRef=useRef(null);
  if(!recorderRef.current)recorderRef.current=new BehavioralRecorder(setSnapshot);
  const recorder=recorderRef.current;
  const {pathname}=useLocation();
  useLayoutEffect(()=>{recorder.contextChanged();},[pathname,recorder]);
  useEffect(()=>()=>recorder.destroy(),[recorder]);
  const active=['starting','recording','saving','save_failed','start_failed','saved','incomplete'].includes(snapshot.state);
  return (
    <CollectionContext.Provider value={{recorder,snapshot}}>
      {children}
      {active && <aside data-evoguard-control="true" aria-live="polite" style={{position:'fixed',bottom:12,left:12,zIndex:1600,maxWidth:440,padding:14,border:'2px solid #1d4ed8',borderRadius:8,background:'#fff',color:'#111827',boxShadow:'0 3px 16px #0003'}}>
        <strong>EvoGuard dataset · {snapshot.participant}</strong>
        <p>{snapshot.state==='recording'?(snapshot.paused?'Paused — return to an allowed browsing task':'Recording mouse and keyboard timing'):snapshot.state.replace(/_/g,' ')}</p>
        <p>{Math.floor(snapshot.elapsedMs/1000)} s · {snapshot.total} captured · {snapshot.acknowledged} acknowledged</p>
        {snapshot.error && <p role="alert" style={{color:'#b91c1c',maxWidth:400}}>{snapshot.error} Keep this tab open.</p>}
        {snapshot.result && <p>Session {snapshot.result.status}. <Link to="/data-collection" style={{color:'#1d4ed8',textDecoration:'underline'}}>View result / download JSON</Link></p>}
        {snapshot.state==='recording' && <button onClick={()=>recorder.stop()} style={buttonStyle}>Stop and save</button>}
        {['save_failed','start_failed'].includes(snapshot.state) && <button onClick={()=>recorder.retry()} style={buttonStyle}>Retry saving</button>}
      </aside>}
    </CollectionContext.Provider>
  );
}
export const buttonStyle={background:'#1d4ed8',color:'white',padding:'9px 16px',borderRadius:5,border:0,cursor:'pointer',marginRight:8};
