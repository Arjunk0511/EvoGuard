"""Local testing backend: reference scoring and private JSON reports, no database."""
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sys
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'behavior_reference'))
from service import ReferenceScorer

ALLOWED = {'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4000', 'http://127.0.0.1:4000'}
REPORTS = ROOT / 'reports'
SESSIONS = {}
SCORER = None
ADMIN_TOKEN = os.environ.get('EVOGUARD_REPORT_TOKEN') or secrets.token_urlsafe(32)

def now():
    return datetime.now(timezone.utc).isoformat()

def save(report):
    REPORTS.mkdir(exist_ok=True)
    path = REPORTS / (report['session_id'] + '.json')
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(report, indent=2, allow_nan=False), encoding='utf-8')
    temporary.replace(path)

def read_report(sid):
    # Never interpret an arbitrary request parameter as a filesystem path.
    if len(sid) != 32 or any(c not in '0123456789abcdef' for c in sid):
        raise ValueError('Invalid session')
    return json.loads((REPORTS / (sid + '.json')).read_text(encoding='utf-8'))

class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(8)

    def reply(self, code, data):
        body = json.dumps(data, allow_nan=False).encode()
        self.send_response(code)
        origin = self.headers.get('Origin')
        if origin in ALLOWED:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if self.headers.get('Origin') not in ALLOWED:
            return self.reply(403, {'error': 'Origin denied'})
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            return self.reply(200, {'status': 'ok', 'mode': 'backend_reports'})
        if not hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + ADMIN_TOKEN):
            return self.reply(401, {'error': 'Admin report token required'})
        try:
            if self.path == '/reports':
                items = []
                for p in sorted(REPORTS.glob('*.json'), reverse=True):
                    r = json.loads(p.read_text(encoding='utf-8'))
                    items.append({k:r[k] for k in ('session_id','started_at','last_received_at','status','latest_result')})
                return self.reply(200, {'reports': sorted(items, key=lambda x:x['started_at'], reverse=True)})
            if self.path.startswith('/reports/'):
                return self.reply(200, read_report(self.path[len('/reports/'):]))
        except (ValueError, FileNotFoundError):
            return self.reply(404, {'error': 'Report not found'})
        self.reply(404, {'error': 'Not found'})

    def do_POST(self):
        if self.headers.get('Origin') not in ALLOWED:
            return self.reply(403, {'error': 'Origin denied'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 2 * 1024 * 1024:
                return self.reply(413, {'error': 'Invalid body size'})
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError('Expected object')
            if self.path == '/sessions':
                if len(SESSIONS) >= 10000:
                    return self.reply(503, {'error': 'Local session limit; restart backend'})
                sid, token = secrets.token_hex(16), secrets.token_urlsafe(32)
                report = {'report_version':'1.0', 'session_id':sid, 'user_id':None,
                          'identity':'anonymous_visit', 'started_at':now(), 'last_received_at':now(),
                          'status':'awaiting_evidence', 'latest_result':None, 'windows':[],
                          'ids_action':'observation_only', 'note':'Similarity score, not measured accuracy. No automatic blocking.'}
                save(report)
                SESSIONS[sid] = token
                print('[VISIT] ' + sid + ' awaiting evidence', flush=True)
                return self.reply(201, {'session_id':sid, 'session_token':token})
            if self.path != '/windows':
                return self.reply(404, {'error': 'Not found'})
            sid = data.get('session_id', '')
            token = SESSIONS.get(sid) if isinstance(sid, str) else None
            if not token or not hmac.compare_digest(self.headers.get('Authorization',''), 'Bearer ' + token):
                return self.reply(401, {'error': 'Invalid session'})
            index = data.get('window_index')
            if type(index) is not int or not 0 <= index < 10000:
                raise ValueError('Invalid window index')
            window = data.get('window')
            digest = hashlib.sha256(json.dumps(window, sort_keys=True, allow_nan=False).encode()).hexdigest()
            report = read_report(sid)
            previous = next((w for w in report['windows'] if w['window_index']==index), None)
            if previous:
                if previous['payload_digest'] != digest:
                    return self.reply(409, {'error':'Window index already used'})
                return self.reply(200, {'accepted':True, 'window_index':index})
            result = SCORER.score(window)
            record = {'window_index':index, 'received_at':now(), 'payload_digest':digest, 'result':result}
            report['windows'].append(record)
            report['windows'].sort(key=lambda w:w['window_index'])
            report['latest_result'] = report['windows'][-1]['result']
            report['last_received_at'] = now()
            report['status'] = report['latest_result']['status']
            save(report)
            print('[BEHAVIOR REPORT] ' + json.dumps({'session_id':sid, **record}), flush=True)
            self.reply(200, {'accepted':True, 'window_index':index})
        except (ValueError, KeyError, TypeError, OverflowError, StopIteration):
            self.reply(400, {'error':'Invalid behavioral window'})
        except OSError:
            self.reply(503, {'error':'Report could not be saved'})

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    SCORER = ReferenceScorer()
    REPORTS.mkdir(exist_ok=True)
    print('Backend reports: http://127.0.0.1:5006', flush=True)
    print('Admin report token (keep private): ' + ADMIN_TOKEN, flush=True)
    print('JSON reports: ' + str(REPORTS), flush=True)
    HTTPServer(('127.0.0.1', 5006), Handler).serve_forever()
