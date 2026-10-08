const fs=require('node:fs');
const {validateEvent,quality}=require('../security/behaviorDatasetStore');
const filename=process.argv[2];
if(!filename){console.error('Usage: node scripts/inspectBehaviorSession.js path-to-session.json');process.exit(1);}
try {
 const s=JSON.parse(fs.readFileSync(filename,'utf8'));
 if(s.schema_version!=='2.0' || s.timestamp_unit!=='milliseconds' || !Array.isArray(s.events))throw new Error('Not a v2 millisecond raw session.');
 let prev=0;s.events.forEach((e,i)=>{validateEvent(e,i,prev);prev=e.timestamp;});
 if(s.integrity.event_count!==s.events.length)throw new Error('Event total mismatch');
 if(s.duration_ms!==null && s.duration_ms<prev)throw new Error('Duration precedes last event');
 const q=quality(s,s.quality.client_counters);
 console.log(JSON.stringify({session_id:s.session_id,participant_id:s.participant_id,status:s.status,duration_seconds:s.duration_ms===null?null:s.duration_ms/1000,event_count:s.events.length,event_counts:q.event_counts_by_type,quality_flags:q.flags,unmatched_keydown_count:q.unmatched_keydown_count},null,2));
 console.log('Structure check passed. This is not a model-quality or sufficient-data verdict.');
} catch(error){console.error('Session check failed:',error.message);process.exitCode=1;}
