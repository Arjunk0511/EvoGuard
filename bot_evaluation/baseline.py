"""Exploratory model only. No held-out accuracy claim; no enforcement decisions."""
import argparse, collections, hashlib, json, math, zipfile
from pathlib import Path
from features import extract
WINDOW_MS = 30000
NAMES = [p+'_'+s for p in ('mouse_speed_css_px_s','key_hold_ms','keydown_interval_ms') for s in ('mean','std','median')]

def windows(session):
    extract(session)  # Validate source ordering before slicing.
    for start in range(0, int(session['duration_ms']) - WINDOW_MS + 1, WINDOW_MS):
        es=[dict(e) for e in session['events'] if start <= e['timestamp'] < start+WINDOW_MS]
        for seq,e in enumerate(es):e.update(seq=seq,timestamp=e['timestamp']-start)
        f,q=extract(dict(session,events=es,duration_ms=WINDOW_MS))
        usable=f['mouse_speed_css_px_s_count'] >= 5 and f['key_hold_ms_count'] >= 5
        yield start, f, usable

def probability(model, f):
    z=model['intercept']+sum(w*(f[n]-m)/s for n,w,m,s in zip(model['features'],model['weights'],model['mean'],model['scale']))
    return 1/(1+math.exp(-max(-700,min(700,z))))

def read_archive(path, label):
    with zipfile.ZipFile(path) as z:
        files={n.replace('\\','/'):n for n in z.namelist()}
        manifest=json.loads(z.read(files['manifest.json'])) if label=='bot' else None
        entries={e['session_id']:e for e in manifest['sessions'] if e['status']=='complete'} if manifest else {}
        seen=set()
        for name,original in files.items():
            if not name.startswith('raw/') or not name.endswith('.json'):continue
            raw=z.read(original);d=json.loads(raw);sid=d['session_id']
            if d['behavior_label']!=label or d['data_origin']!=('human_browser' if label=='human' else 'playwright_browser'):raise ValueError('provenance mismatch')
            if d['status']!='complete' or not d['integrity']['acknowledged_complete']:raise ValueError('incomplete source')
            if d['integrity']['event_count']!=len(d['events']):raise ValueError('event count mismatch')
            if d['quality']['client_counters']['dropped_events']:raise ValueError('dropped events')
            counts=collections.Counter(e['type'] for e in d['events'])
            if any(counts[k]!=v for k,v in d['quality']['event_counts_by_type'].items()):raise ValueError('type counts mismatch')
            entry=entries.get(sid)
            if manifest:
                if not entry or hashlib.sha256(raw).hexdigest()!=entry['sha256']:raise ValueError('manifest hash mismatch')
                if entry['event_count']!=len(d['events']) or entry['duration_ms']!=d['duration_ms']:raise ValueError('manifest totals mismatch')
            seen.add(sid)
            yield d, {'profile':entry['profile'] if entry else None,'generator_version':manifest['generator_version'] if manifest else None,
                      'source_archive':Path(path).name,'source_sha256':hashlib.sha256(raw).hexdigest()}
        if manifest and seen!=set(entries):raise ValueError('manifest session missing from archive')

def train(args):
    import numpy as np
    import sklearn
    from sklearn.preprocessing import StandardScaler
    from sklearn.linear_model import LogisticRegression
    records=[];validation=[];seen=set();streams=set()
    for label, paths in [('human',[args.human]),('bot',args.bots)]:
        for path in paths:
            for d,meta in read_archive(path,label):
                sid=d['session_id'];digest=hashlib.sha256(json.dumps(d['events'],sort_keys=True).encode()).hexdigest()
                if sid in seen or digest in streams:raise ValueError('duplicate session or stream')
                seen.add(sid);streams.add(digest)
                usable=0;count=0
                for start,f,ok in windows(d):
                    count+=1
                    if ok:
                        usable+=1;records.append({'session_id':sid,'start_ms':start,'label':label,'features':{n:f[n] for n in NAMES},**meta})
                validation.append({'session_id':sid,'original_id':d['participant_id'],'label':label,
                                   'duration_seconds':d['duration_ms']/1000,'events':len(d['events']),
                                   'full_windows':count,'usable_windows':usable,**meta})
    X=np.array([[r['features'][n] for n in NAMES] for r in records]);y=np.array([r['label']=='bot' for r in records],dtype=int)
    if len(set(y))!=2:raise ValueError('need eligible windows from both classes')
    # Equal total contribution per contributing session within each class.
    per_session=collections.Counter(r['session_id'] for r in records)
    sessions_per_class=collections.Counter(r['label'] for r in validation if r['usable_windows'])
    weights=np.array([len(records)/(2*sessions_per_class[r['label']]*per_session[r['session_id']]) for r in records])
    scaler=StandardScaler().fit(X,sample_weight=weights)
    clf=LogisticRegression(C=1.0,max_iter=2000,random_state=42).fit(scaler.transform(X),y,sample_weight=weights)
    model={'version':'evoguard_exploratory_1','feature_version':'pilot_features_1.0','window_ms':WINDOW_MS,'features':NAMES,
           'mean':scaler.mean_.tolist(),'scale':scaler.scale_.tolist(),'weights':clf.coef_[0].tolist(),'intercept':float(clf.intercept_[0]),
           'classes':['human','bot'],'status':'exploratory_only','calibrated':False,'enforcement_allowed':False}
    err=max(abs(probability(model,r['features'])-float(p)) for r,p in zip(records,clf.predict_proba(scaler.transform(X))[:,1]))
    assert err < 1e-10
    report={'sessions':dict(collections.Counter(r['label'] for r in validation)),
            'eligible_windows':dict(collections.Counter(r['label'] for r in records)),
            'contributing_sessions':dict(sessions_per_class),'bot_profiles':dict(collections.Counter(r['profile'] for r in validation if r['label']=='bot')),
            'window_ms':WINDOW_MS,'export_probability_max_error':err,'sklearn_version':sklearn.__version__,
            'evaluation':None,'reason':'Human participant identities unknown; all eligible data used for exploratory fitting, no held-out evaluation.',
            'limitations':['Task and timing differences may dominate predictions.','Three scripted bot profiles do not represent all bots.','Human pilot includes only one touchpad session.','Both modalities required; sparse windows abstain.','Two bot generator versions are retained in provenance.'],
            'session_details':validation}
    args.output.mkdir(parents=True,exist_ok=True)
    for name,data in [('model.json',model),('report.json',report)]:
        (args.output/name).write_text(json.dumps(data,indent=2,allow_nan=False),encoding='utf-8')
    (args.output/'training_windows.jsonl').write_text(''.join(json.dumps(r)+'\n' for r in records),encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='session_details'},indent=2))

def score(args):
    model=json.loads(args.model.read_text(encoding='utf-8'))
    if model['window_ms']!=WINDOW_MS or model['features']!=NAMES:raise ValueError('incompatible model schema')
    paths=sorted(args.input.rglob('*.json')) if args.input.is_dir() else [args.input]
    output=[]
    for path in paths:
        d=json.loads(path.read_text(encoding='utf-8'))
        results=[]
        for start,f,ok in windows(d):
            results.append({'start_ms':start,'status':'exploratory_score' if ok else 'insufficient_evidence',
                            'bot_score':round(probability(model,f),6) if ok else None,'enforcement_allowed':False})
        output.append({'session_id':d.get('session_id'),'windows':results,'status':'processed' if results else 'insufficient_duration'})
    print(json.dumps(output,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='command',required=True)
    t=sub.add_parser('train');t.add_argument('--human',required=True,type=Path);t.add_argument('--bots',required=True,nargs='+',type=Path);t.add_argument('--output',type=Path,default=Path(__file__).parent/'model')
    s=sub.add_parser('score');s.add_argument('--input',required=True,type=Path);s.add_argument('--model',type=Path,default=Path(__file__).parent/'model/model.json')
    a=p.parse_args();train(a) if a.command=='train' else score(a)
