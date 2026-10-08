"""Run from the EvoGuard root: python .\EvoGuard_Backend_Reports\install.py"""
from pathlib import Path
from datetime import datetime
import shutil

source = Path(__file__).resolve().parent
root = Path.cwd()
front = root / 'flipkart-mern-master/flipkart-mern-master/frontend'
target = front / 'src/evoguard/EvoGuardLive.jsx'
if not target.is_file() or not (root/'behavior_reference/service.py').is_file():
    raise SystemExit('Run from your EvoGuard root; existing EvoGuardLive.jsx and behavior_reference/service.py are required.')
app = front / 'src/App.js'
if app.is_file() and 'EvoGuardPanel' in app.read_text(encoding='utf-8-sig'):
    raise SystemExit('Remove the EvoGuardPanel import and JSX from App.js first. Keep EvoGuardLive mounted.')
backup = root / ('report_patch_backup_' + datetime.now().strftime('%Y%m%d_%H%M%S_%f'))
backup.mkdir()
shutil.copy2(target, backup/'EvoGuardLive.jsx')
recorder = front / 'src/behavioral/referenceRecorder.js'
if recorder.exists():
    shutil.copy2(recorder, backup/'referenceRecorder.js')
recorder.parent.mkdir(parents=True, exist_ok=True)
backend = root/'behavior_reports'
if backend.exists():
    raise SystemExit('behavior_reports already exists. No frontend changes made; review it before reinstalling.')
shutil.copytree(source/'behavior_reports', backend, ignore=shutil.ignore_patterns('__pycache__', 'reports'))
shutil.copy2(source/'frontend/referenceRecorder.js', recorder)
shutil.copy2(source/'frontend/EvoGuardLive.jsx', target)
print('Installed. Backup:', backup)
print('Stop the old scorer, then run: python .\\behavior_reports\\server.py')
