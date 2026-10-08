"""Local-only automation; actual browser events pass through the existing recorder."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import random
import socket
import subprocess
import time
import urllib.request
import uuid
import zipfile

PROFILES = ('instant', 'uniform', 'variable')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sessions', type=int, default=12)
    parser.add_argument('--seconds', type=int, default=90, help='minimum approximate session length')
    parser.add_argument('--seed', type=int, default=2026)
    parser.add_argument('--start-index', type=int, default=0, help='first profile/seed index; use 3 after three successful sessions')
    parser.add_argument('--port', type=int, default=5003)
    args = parser.parse_args()
    if not 1 <= args.sessions <= 999 or not 15 <= args.seconds <= 600 or not 1024 <= args.port <= 65535:
        parser.error('sessions 1..999; seconds 15..600; port 1024..65535')
    if args.start_index < 0 or args.start_index + args.sessions > 1000:
        parser.error('start-index must be nonnegative and start-index + sessions <= 1000')
    from playwright.sync_api import sync_playwright, expect
    root = Path(__file__).resolve().parent
    run_id = str(uuid.uuid4())
    output = root / 'output' / run_id
    output.mkdir(parents=True)
    # Refuse to attach to another process, especially a human collection server.
    with socket.socket() as sock:
        if sock.connect_ex(('127.0.0.1', args.port)) == 0:
            raise SystemExit(f'Port {args.port} is occupied. Choose --port 5004.')
    env = dict(os.environ, EVOGUARD_DATASET_PORT=str(args.port), EVOGUARD_DATASET_DIR=str(output))
    base = f'http://127.0.0.1:{args.port}'
    log = (output / 'server.log').open('w', encoding='utf-8')
    process = subprocess.Popen(['node', str(root/'collector/server.cjs')], env=env, stdout=log, stderr=subprocess.STDOUT)
    manifest = {'run_id': run_id, 'generator_version': '1.1', 'seed': args.seed,
                'sessions': [], 'scope': 'local scripted automation, not representative of all bots'}
    manifest_path = output/'manifest.json'
    def save_manifest():
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    try:
        for _ in range(60):
            if process.poll() is not None:
                raise RuntimeError('Collector stopped. See server.log.')
            try:
                with urllib.request.urlopen(base+'/api/behavior/dataset/v2/health', timeout=1) as response:
                    if json.load(response)['success']: break
            except OSError:
                time.sleep(.2)
        else: raise RuntimeError('Collector did not start')
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=False)
            try:
                for index in range(args.start_index, args.start_index + args.sessions):
                    profile = PROFILES[index % len(PROFILES)]
                    seed = args.seed + index
                    rng = random.Random(seed)
                    entry = {'index': index, 'profile': profile, 'seed': seed, 'status': 'running',
                             'split_group': profile, 'run_id': run_id}
                    manifest['sessions'].append(entry); save_manifest()
                    context = browser.new_context(viewport={'width':1536,'height':730})
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    try:
                        page.goto(base+'/data-collection'); page.bring_to_front()
                        page.locator('#participant').fill(f'user{9000+index}')
                        page.locator('#consent').check()
                        page.locator('#start-btn').click()
                        page.wait_for_function("document.querySelector('#panel-state').textContent.startsWith('Recording')")
                        def pause():
                            page.wait_for_timeout(rng.randint(100,600) if profile=='variable' else 150)
                        def click(selector):
                            loc=page.locator(selector).first
                            loc.scroll_into_view_if_needed()
                            box=loc.bounding_box()
                            if box is None: raise RuntimeError('Target is not visible')
                            page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2,
                                            steps=1 if profile=='instant' else 12)
                            # Recheck visibility, stability and hit target at click time.
                            # Raw coordinate clicks can miss when scrolling/layout changes.
                            hold = 1 if profile=='instant' else (60 if profile=='uniform' else rng.randint(25,140))
                            loc.click(delay=hold, timeout=15000)
                            pause()
                        def typing(text):
                            for char in text:
                                key='Space' if char==' ' else char
                                page.keyboard.down(key)
                                page.wait_for_timeout(1 if profile=='instant' else (45 if profile=='uniform' else rng.randint(20,110)))
                                page.keyboard.up(key)
                                page.wait_for_timeout(1 if profile=='instant' else (65 if profile=='uniform' else rng.randint(25,180)))
                        started=time.monotonic()
                        while time.monotonic()-started < args.seconds:
                            click('a[data-nav][href="/"]')
                            for amount in [350,350,-500]:
                                page.mouse.wheel(0,amount); pause()
                            click('#search');page.keyboard.press('Control+A');page.keyboard.press('Backspace')
                            typing(rng.choice(['shoes','headphones','backpack']))
                            page.keyboard.press('Enter');pause()
                            click('a[data-nav][href^="/product/"]')
                            page.mouse.wheel(0,450);pause();page.mouse.wheel(0,-450);pause()
                            before = int(page.locator('#cart-count').inner_text())
                            click('[data-add]')
                            expect(page.locator('#cart-count')).to_have_text(str(before + 1))
                            click('a[data-nav][href="/cart"]')
                            expect(page).to_have_url(base + '/cart')
                            expect(page.locator('[data-remove]').first).to_be_visible()
                            click('[data-remove]')
                            expect(page.locator('[data-remove]')).to_have_count(0)
                            expect(page.locator('#cart-count')).to_have_text('0')
                            click('a[data-nav][href="/data-collection"]')
                            click('#practice')
                            typing('I am comparing shoes headphones and a backpack for this project.')
                        click('#stop-btn')
                        page.wait_for_function("document.querySelector('#panel-state').textContent === 'Session complete and saved'",timeout=60000)
                        sid=page.locator('#session-id').inner_text()
                        raw_path=output/'raw'/f'user{9000+index}'/(sid+'.json')
                        raw=json.loads(raw_path.read_text(encoding='utf-8'))
                        assert raw['behavior_label']=='bot' and raw['data_origin']=='playwright_browser'
                        assert raw['status']=='complete' and raw['integrity']['acknowledged_complete']
                        counts=raw['quality']['event_counts_by_type']
                        if counts['mousemove']==0 or counts['keyup']==0:raise RuntimeError('Missing mouse or keyboard events')
                        entry.update(status='complete',session_id=sid,raw_path=str(raw_path.relative_to(output)),
                                     sha256=hashlib.sha256(raw_path.read_bytes()).hexdigest(),
                                     event_count=len(raw['events']),duration_ms=raw['duration_ms'])
                        print(f'{index-args.start_index+1}/{args.sessions}: {profile}, {len(raw["events"])} events saved',flush=True)
                    except Exception as exc:
                        entry.update(status='failed',error=str(exc),page_url=page.url)
                        try:
                            page.screenshot(path=str(output / f'failure-{index}.png'), full_page=True)
                        except Exception:
                            pass
                        save_manifest()
                        raise
                    finally:
                        context.close()
                    save_manifest()
            finally:
                browser.close()
    finally:
        save_manifest()
        process.terminate()
        try:process.wait(timeout=10)
        except subprocess.TimeoutExpired:process.kill();process.wait()
        log.close()
        archive = root / ('EvoGuard_Bot_Raw_' + run_id + '.zip')
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as zipped:
            zipped.write(manifest_path, 'manifest.json')
            for item in manifest['sessions']:
                if item['status'] == 'complete':
                    file = output / item['raw_path']
                    zipped.write(file, item['raw_path'])
        print('Dataset folder:',output,flush=True)
        print('Upload archive:',archive,flush=True)

if __name__=='__main__':main()
