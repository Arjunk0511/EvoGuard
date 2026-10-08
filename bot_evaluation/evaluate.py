"""Evaluate completed bot-test archives with frozen parameters; never fits a model."""
import argparse,collections,hashlib,json
from pathlib import Path
from baseline import read_archive,windows,probability
p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent
plan=json.loads((root/'evaluation_plan.json').read_text())
raw_model=(root/'frozen_model.json').read_bytes()
if hashlib.sha256(raw_model).hexdigest()!=plan['model_sha256']:raise SystemExit('Frozen model changed; evaluation stopped')
model=json.loads(raw_model);groups={};details=[];seen=set()
for d,meta in read_archive(a.archive,'bot'):
 if d['session_id'] in seen:raise ValueError('Duplicate session')
 seen.add(d['session_id'])
 if meta['profile'] not in plan['profiles'] or meta['generator_version']!='heldout_patterns_1.0':raise ValueError('Not a new test-pattern session')
 g=groups.setdefault(meta['profile'],dict(sessions=0,full_windows=0,scored_windows=0,detected_windows=0))
 g['sessions']+=1
 for start,f,ok in windows(d):
  g['full_windows']+=1
  score=probability(model,f) if ok else None
  if ok:g['scored_windows']+=1;g['detected_windows']+=score>=plan['threshold']
  details.append(dict(session_id=d['session_id'],profile=meta['profile'],start_ms=start,status='scored' if ok else 'insufficient_evidence',bot_score=score))
for g in groups.values():
 g['abstained_windows']=g['full_windows']-g['scored_windows']
 g['coverage']=g['scored_windows']/g['full_windows'] if g['full_windows'] else None
 g['recall_on_scored_windows']=g['detected_windows']/g['scored_windows'] if g['scored_windows'] else None
 g['detected_fraction_all_full_windows']=g['detected_windows']/g['full_windows'] if g['full_windows'] else None
report={'threshold':plan['threshold'],'model_sha256':plan['model_sha256'],'profiles':groups,'windows':details,'note':'Bot-only test report: precision and overall accuracy require separate human results. Windows are correlated within sessions.'}
out=a.archive.with_suffix('.evaluation.json');out.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(groups,indent=2));print('Report:',out)
