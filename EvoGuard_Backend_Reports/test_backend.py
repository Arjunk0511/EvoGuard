import sys, threading, tempfile, json, urllib.request, urllib.error
from pathlib import Path
sys.path.insert(0, str(Path.cwd()/'behavior_reports'))
import server as s
s.SCORER=s.ReferenceScorer()
s.REPORTS=Path(tempfile.mkdtemp())
http=s.HTTPServer(('127.0.0.1',0),s.Handler)
threading.Thread(target=http.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(http.server_port)
def call(path,data=None,token=None):
    headers={'Origin':'http://localhost:3000','Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    req=urllib.request.Request(base+path,data=None if data is None else json.dumps(data).encode(),headers=headers)
    try:
        with urllib.request.urlopen(req) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:return e.code,json.load(e)
a=call('/sessions',{})[1]; b=call('/sessions',{})[1]
window={'schema_version':'2.0','timestamp_unit':'milliseconds','duration_ms':30000,'events':[]}
payload={'session_id':a['session_id'],'window_index':0,'window':window}
assert call('/windows',payload,b['session_token'])[0]==401
code,reply=call('/windows',payload,a['session_token']);assert code==200 and set(reply)=={'accepted','window_index'}
assert call('/windows',payload,a['session_token'])[0]==200
assert call('/reports',token=a['session_token'])[0]==401
r=call('/reports/'+a['session_id'],token=s.ADMIN_TOKEN)[1]
assert len(r['windows'])==1 and r['latest_result']['risk_score'] is None
assert call('/reports/'+b['session_id'],token=s.ADMIN_TOKEN)[1]['status']=='awaiting_evidence'
assert call('/score',window)[0]==404
# Use an actual eligible reference window, not a fabricated fixed score.
from baseline import read_archive
for d,meta in read_archive(Path.cwd()/'behavior_reference/bot_reference.zip','bot'):
    es=[dict(e) for e in d['events'] if 0<=e['timestamp']<30000]
    candidate={**window,'events':es}
    try:
        if s.SCORER.score(candidate)['status']=='scored':break
    except (ValueError,KeyError):continue
else:raise AssertionError('No reference window')
payload={'session_id':a['session_id'],'window_index':1,'window':candidate}
assert call('/windows',payload,a['session_token'])[0]==200
r=call('/reports/'+a['session_id'],token=s.ADMIN_TOKEN)[1]
assert r['latest_result']['status']=='scored' and 0<=r['latest_result']['risk_score']<=100
assert call('/reports',token=s.ADMIN_TOKEN)[0]==200
http.shutdown()
print('PASS: real scoring, report files, session isolation, admin authorization, deduplication, no public scores, insufficient evidence.')
