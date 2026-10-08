"""Local reference-similarity demonstration. Python stdlib only; no training."""
import collections
import json
import math
import statistics
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from baseline import read_archive, windows, NAMES

ROOT = Path(__file__).resolve().parent
ALLOWED = {'http://localhost:3000', 'http://127.0.0.1:3000'}
TYPES = {'mousemove','mousedown','mouseup','click','scroll','keydown','keyup','focus','blur','visibilitychange','capturepause','captureresume','contextchange'}
PAGES = {'/','/products','/products/:keyword','/product/:id','/cart','/data-collection','restricted','other'}
FIELDS = set('seq type timestamp x y button key_category press_id scroll_x scroll_y page viewport_width viewport_height visible'.split())
CATEGORIES = set('LETTER NUMBER SPACE ENTER BACKSPACE TAB SHIFT CONTROL ALT ARROW ESCAPE DELETE SPECIAL UNKNOWN'.split())

def finite(x):
    return type(x) in (int, float) and math.isfinite(x)

def validate(d):
    if not isinstance(d, dict) or d.get('schema_version') != '2.0' or d.get('timestamp_unit') != 'milliseconds' or d.get('duration_ms') != 30000:
        raise ValueError('Expected a schema 2.0 30-second window')
    es = d.get('events')
    if not isinstance(es, list) or len(es) > 6000:
        raise ValueError('Invalid event count')
    for e in es:
        if not isinstance(e, dict) or set(e) != FIELDS or e['type'] not in TYPES or e['page'] not in PAGES:
            raise ValueError('Invalid event schema')
        if not finite(e['timestamp']) or not 0 <= e['timestamp'] < 30000:
            raise ValueError('Invalid timestamp')
        for k in ('viewport_width','viewport_height'):
            if not finite(e[k]) or not 0 < e[k] <= 100000: raise ValueError('Invalid viewport')
        for k in ('x','y','scroll_x','scroll_y'):
            if e[k] is not None and (not finite(e[k]) or abs(e[k]) > 1e8): raise ValueError('Invalid coordinates')
        if e['key_category'] is not None and e['key_category'] not in CATEGORIES: raise ValueError('Invalid category')
        if e['press_id'] is not None and (not isinstance(e['press_id'],str) or len(e['press_id']) > 32): raise ValueError('Invalid pair')
        if e['type'] in ('keydown','keyup') and (not e['press_id'] or e['key_category'] not in CATEGORIES): raise ValueError('Missing key pair')
        if e['button'] is not None and (type(e['button']) is not int or not 0 <= e['button'] <= 5): raise ValueError('Invalid button')
        if e['visible'] is not None and type(e['visible']) is not bool: raise ValueError('Invalid visibility')
    return next(windows(d))

class ReferenceScorer:
    def __init__(self):
        self.rows = []
        self.summary = {}
        for label, filename in [('human','human_reference.zip'), ('bot','bot_reference.zip')]:
            sessions = full = eligible = 0
            for d, meta in read_archive(ROOT / filename, label):
                sessions += 1
                for start, f, ok in windows(d):
                    full += 1
                    if ok:
                        eligible += 1
                        self.rows.append({'label':label,'session':d['session_id'],'profile':meta['profile'], 'x':[f[n] for n in NAMES]})
            self.summary[label] = {'sessions':sessions,'full_windows':full,'eligible_windows':eligible}
        if any(not self.summary[k]['eligible_windows'] for k in ('human','bot')): raise ValueError('Both classes need reference windows')
        # Equal total weight per class and per contributing session.
        count = collections.Counter((r['label'],r['session']) for r in self.rows)
        sessions = {label:len({r['session'] for r in self.rows if r['label']==label}) for label in ('human','bot')}
        weights = [1/(2*sessions[r['label']]*count[r['label'],r['session']]) for r in self.rows]
        self.mean = [sum(w*r['x'][j] for r,w in zip(self.rows,weights)) for j in range(len(NAMES))]
        self.scale = [max(1e-9,math.sqrt(sum(w*(r['x'][j]-self.mean[j])**2 for r,w in zip(self.rows,weights)))) for j in range(len(NAMES))]
        for r in self.rows: r['z'] = [(x-m)/s for x,m,s in zip(r['x'],self.mean,self.scale)]

    def score(self, d):
        _, f, ok = validate(d)
        base = {'method':'reference_similarity_v1','enforcement_allowed':False,'window_ms':30000,
                'evidence':{'mouse_pairs':f['mouse_speed_css_px_s_count'],'key_pairs':f['key_hold_ms_count']},
                'note':'Reference similarity index; not a probability or measured accuracy.'}
        if not ok: return dict(base,status='insufficient_evidence',risk_score=None)
        x = [f[n] for n in NAMES]
        if not all(finite(v) for v in x): raise ValueError('Non-finite feature')
        z = [(v-m)/s for v,m,s in zip(x,self.mean,self.scale)]
        nearest = {}
        for r in self.rows:
            distance = math.sqrt(sum((a-b)**2 for a,b in zip(z,r['z']))/len(z))
            key = (r['label'],r['session'])
            if key not in nearest or distance < nearest[key][0]: nearest[key] = (distance,r['profile'])
        distances = {}
        for label in ('human','bot'):
            best = sorted(v[0] for k,v in nearest.items() if k[0]==label)[:3]
            distances[label] = statistics.mean(best)
        dh, db = distances['human'], distances['bot']
        risk = 50 if dh+db < 1e-12 else 100*dh/(dh+db)
        profile = min((v for k,v in nearest.items() if k[0]=='bot'),key=lambda v:v[0])[1]
        return dict(base,status='scored',risk_score=round(risk,1),
                    comparison='closer_to_bot' if risk>50 else 'closer_to_human' if risk<50 else 'equal_similarity',
                    closest_bot_pattern=profile,human_distance=round(dh,4),bot_distance=round(db,4))

SCORER = None
class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup(); self.connection.settimeout(8)
    def respond(self, code, data):
        b=json.dumps(data,allow_nan=False).encode()
        self.send_response(code)
        origin=self.headers.get('Origin')
        if origin in ALLOWED:
            self.send_header('Access-Control-Allow-Origin',origin)
            self.send_header('Vary','Origin')
        self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(b)))
        self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b)
    def do_OPTIONS(self):
        if self.headers.get('Origin') not in ALLOWED: return self.respond(403,{'error':'Origin not allowed'})
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin',self.headers['Origin'])
        self.send_header('Access-Control-Allow-Methods','GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type');self.end_headers()
    def do_GET(self):
        if self.path!='/health': return self.respond(404,{'error':'Not found'})
        self.respond(200,{'status':'ok','method':'reference_similarity_v1','reference_data':SCORER.summary})
    def do_POST(self):
        if self.headers.get('Origin') not in ALLOWED: return self.respond(403,{'error':'Origin not allowed'})
        if self.path!='/score': return self.respond(404,{'error':'Not found'})
        try:
            n=int(self.headers.get('Content-Length','0'))
            if not 0<n<=2*1024*1024: return self.respond(413,{'error':'Window exceeds body limit'})
            d=json.loads(self.rfile.read(n)); result=SCORER.score(d)
            self.respond(200,result)
        except (ValueError,KeyError,TypeError,OverflowError,StopIteration):
            self.respond(400,{'error':'Invalid behavioral window'})
    def log_message(self,*args): pass

if __name__=='__main__':
    SCORER=ReferenceScorer()
    print(json.dumps(SCORER.summary,indent=2),flush=True)
    print('EvoGuard reference scorer: http://127.0.0.1:5006 (Ctrl+C to stop)',flush=True)
    ThreadingHTTPServer(('127.0.0.1',5006),Handler).serve_forever()
