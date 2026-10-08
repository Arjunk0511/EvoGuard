"""Local advisory scoring service. No third-party Python dependencies."""
import json, math
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from baseline import windows, probability, NAMES, WINDOW_MS
MODEL=json.loads((Path(__file__).parent/'model/model.json').read_text())
TYPES={'mousemove','mousedown','mouseup','click','scroll','keydown','keyup','focus','blur','visibilitychange','capturepause','captureresume','contextchange'}
FIELDS=set('seq type timestamp x y button key_category press_id scroll_x scroll_y page viewport_width viewport_height visible'.split())
PAGES={'/','/products','/products/:keyword','/product/:id','/cart','/data-collection','restricted','other'}
def score_window(d):
 if not isinstance(d,dict) or d.get('duration_ms')!=WINDOW_MS or d.get('schema_version')!='2.0' or d.get('timestamp_unit')!='milliseconds':raise ValueError('Expected a schema 2.0, 30000ms window')
 es=d.get('events')
 if not isinstance(es,list) or len(es)>6000:raise ValueError('Invalid event count')
 for e in es:
  if not isinstance(e,dict) or set(e)!=FIELDS or e['type'] not in TYPES or e['page'] not in PAGES:raise ValueError('Invalid event schema')
  for k in ['timestamp','viewport_width','viewport_height']:
   if type(e[k]) not in (int,float) or not math.isfinite(e[k]):raise ValueError('Invalid numeric field')
  if not 0<=e['timestamp']<WINDOW_MS:raise ValueError('Timestamp outside window')
  for k in ['x','y','scroll_x','scroll_y']:
   if e[k] is not None and (type(e[k]) not in (int,float) or not math.isfinite(e[k])):raise ValueError('Invalid coordinates')
  if e['key_category'] is not None and e['key_category'] not in {'LETTER','NUMBER','SPACE','ENTER','BACKSPACE','TAB','SHIFT','CONTROL','ALT','ARROW','ESCAPE','DELETE','SPECIAL','UNKNOWN'}:raise ValueError('Invalid key category')
  if e['type'].startswith('key') and (not isinstance(e['press_id'],str) or len(e['press_id'])>32 or not isinstance(e['key_category'],str)):raise ValueError('Invalid key pair')
 _,f,ok=next(windows(d))
 if ok and not all(isinstance(f[n],(int,float)) and math.isfinite(f[n]) for n in NAMES):raise ValueError('Invalid derived feature')
 return {'status':'exploratory_score' if ok else 'insufficient_evidence','bot_score':round(probability(MODEL,f),6) if ok else None,
         'enforcement_allowed':False,'model_version':MODEL['version'],'window_ms':WINDOW_MS,
         'evidence':{'mouse_pairs':f['mouse_speed_css_px_s_count'],'key_pairs':f['key_hold_ms_count']}}
class Handler(BaseHTTPRequestHandler):
 def setup(self):
  super().setup();self.connection.settimeout(6)
 def respond(self,status,value):
  b=json.dumps(value,allow_nan=False).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
 def do_GET(self):
  self.respond(200,{'status':'ok','model_version':MODEL['version']}) if self.path=='/health' else self.respond(404,{'error':'not found'})
 def do_POST(self):
  if self.path!='/score':return self.respond(404,{'error':'not found'})
  try:
   n=int(self.headers.get('Content-Length','0'))
   if not 0<n<=2*1024*1024:return self.respond(413,{'error':'body limit'})
   d=json.loads(self.rfile.read(n));result=score_window(d);self.respond(200,result)
  except (ValueError,KeyError,TypeError,OverflowError,StopIteration):self.respond(400,{'error':'Invalid behavioral window'})
 def log_message(self,*args):pass
if __name__=='__main__':
 print('EvoGuard advisory scorer: http://127.0.0.1:5004',flush=True)
 ThreadingHTTPServer(('127.0.0.1',5004),Handler).serve_forever()
