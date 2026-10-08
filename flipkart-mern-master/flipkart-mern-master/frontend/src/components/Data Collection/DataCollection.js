import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useBehavioralCollection,buttonStyle} from '../../behavioral/BehavioralCollector';

export default function DataCollection() {
  const {recorder,snapshot}=useBehavioralCollection();
  const [participant,setParticipant]=useState('user01');
  const [device,setDevice]=useState('mouse');
  const [consent,setConsent]=useState(false);
  const [message,setMessage]=useState('');
  const canStart=['idle','saved','incomplete'].includes(snapshot.state);
  async function start(event) {
    event.preventDefault();document.activeElement?.blur();setMessage('');
    try {await recorder.start(participant.trim(),device,consent);} catch(error) {setMessage(error.message);}
  }
  async function download() {try {await recorder.download();} catch(error) {setMessage(error.message);}}
  return <main style={{maxWidth:920,margin:'80px auto 200px',padding:24,color:'#172033',background:'#fff'}}>
    <h1 style={{fontSize:28,fontWeight:700}}>EvoGuard research dataset</h1>
    <p>Collect one human browsing session. Use the same participant ID for that person's later sessions.</p>
    <section data-evoguard-control="true" style={{background:'#f0f5ff',padding:18,margin:'18px 0',borderRadius:8}}>
      <h2 style={{fontSize:20,fontWeight:600}}>Participant notice</h2>
      <p>We record mouse positions, clicks, scrolling and keyboard timing in approved task fields. We do not store typed characters, passwords or search text. Keyboard timing uses categories such as LETTER and SPACE. Recording pauses in sensitive or unapproved editable fields.</p>
      <p>Your participant code replaces your name, but behavioral patterns can still distinguish people. Only the project team should access these files. Participation is voluntary: you can stop at any time and ask the team to delete sessions using your participant code/session ID.</p>
      <p>Project policy: keep data for project evaluation and delete it within 30 days after evaluation finishes. The project team must carry out deletion; the application does not automatically delete files.</p>
      <form onSubmit={start} style={{display:'grid',gap:12,marginTop:16}}>
        <label>Anonymous participant ID<br/><input value={participant} onChange={e=>setParticipant(e.target.value)} disabled={!canStart} pattern="user[0-9]{2,4}" required autoComplete="off" style={inputStyle}/></label>
        <label>Input device<br/><select value={device} onChange={e=>setDevice(e.target.value)} disabled={!canStart} style={inputStyle}><option value="mouse">Mouse</option><option value="touchpad">Touchpad</option><option value="unknown">Unknown</option></select></label>
        <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} disabled={!canStart}/> I have read the notice and agree to this session.</label>
        <div><button type="submit" disabled={!canStart || !consent} style={{...buttonStyle,opacity:canStart&&consent?1:0.5}}>Start recording</button></div>
      </form>
      {message && <p role="alert" style={{color:'#b91c1c'}}>{message}</p>}
    </section>
    <h2 style={{fontSize:20,fontWeight:600}}>Tasks for this session</h2>
    <ol style={{listStyle:'decimal',paddingLeft:24,lineHeight:1.9}}>
      <li>Open the homepage and browse naturally.</li>
      <li>Search for ordinary product terms such as shoes, headphones and backpack.</li>
      <li>Open a few products and scroll through their details.</li>
      <li>Add an item to the cart, then remove it.</li>
      <li>Return here and type the practice sentence below in your usual rhythm.</li>
      <li>After about 3–5 minutes, use the persistent Stop and save button.</li>
    </ol>
    <p style={{margin:'14px 0'}}><Link to="/" style={{color:'#1d4ed8',textDecoration:'underline',marginRight:24}}>Open homepage</Link><Link to="/products" style={{color:'#1d4ed8',textDecoration:'underline'}}>Browse products</Link></p>
    <label htmlFor="behavior-practice">Practice sentence: “I am browsing shoes, headphones and a backpack for this project.”</label>
    <textarea id="behavior-practice" data-evoguard-typing="true" autoComplete="off" spellCheck={false} autoCorrect="off" rows={3} placeholder="Use only the provided practice sentence; do not enter personal details." style={{...inputStyle,width:'100%',margin:'8px 0 20px'}}/>
    <p>The practice text stays in this page's input; it is not included in behavioral events.</p>
    {snapshot.result && <section data-evoguard-control="true" style={{padding:18,background:snapshot.state==='saved'?'#ecfdf5':'#fff7ed',marginTop:20}}>
      <h2 style={{fontSize:20,fontWeight:600}}>{snapshot.state==='saved'?'Session saved':'Interrupted session retained'}</h2>
      <p style={{overflowWrap:'anywhere'}}>Session: {snapshot.sessionId}</p>
      <p>{snapshot.acknowledged} events acknowledged. Status: {snapshot.result.status}.</p>
      <p>Quality notes: {snapshot.result.quality.flags.join(', ') || 'No listed structural issues'}.</p>
      <button onClick={download} style={buttonStyle}>Download raw JSON</button>
      <p>Quality notes are collection checks, not model predictions.</p>
    </section>}
  </main>;
}
const inputStyle={border:'1px solid #9ca3af',borderRadius:5,padding:10,color:'#111827',background:'#fff'};
