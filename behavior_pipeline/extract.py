"""Shared, dependency-free EvoGuard pilot feature extractor. Python 3.10+."""
import argparse
import collections
import hashlib
import json
import math
from pathlib import Path
import statistics
import zipfile

VERSION = 'pilot_features_1.0'
BOUNDARIES = {'contextchange', 'blur', 'focus', 'visibilitychange', 'capturepause', 'captureresume'}

def stats(values, prefix):
    return {prefix + '_count': len(values),
            prefix + '_mean': statistics.mean(values) if values else None,
            prefix + '_std': statistics.pstdev(values) if values else None,
            prefix + '_median': statistics.median(values) if values else None}

def extract(session):
    """Use the same function on completed live windows; timestamps are milliseconds.
    Missing measurements remain None; do not equate missing keyboard data with bots.
    """
    events = session['events']
    duration = session['duration_ms']
    if not isinstance(duration, (float, int)) or not math.isfinite(duration) or duration <= 0:
        raise ValueError('duration_ms must be positive and finite')
    previous_time = -1
    for i, e in enumerate(events):
        t = e['timestamp']
        if e['seq'] != i or not isinstance(t, (float, int)) or not math.isfinite(t) or not 0 <= t <= duration or t < previous_time:
            raise ValueError(f'invalid sequence or timestamp at event {i}')
        previous_time = t
    if session.get('timestamp_unit') != 'milliseconds':
        raise ValueError('timestamp_unit must be milliseconds')
    if session.get('schema_version') != '2.0':
        raise ValueError('expected schema_version 2.0')
    counts = collections.Counter(e['type'] for e in events)
    speed, distance, holds, down_intervals, click_holds, scroll_distances = [], [], [], [], [], []
    keys, buttons = {}, {}
    move = scroll = last_down = None
    unmatched = zero_dt = 0
    for e in events:
        kind = e['type']
        if kind in BOUNDARIES:
            unmatched += len(keys)
            keys.clear(); buttons.clear()
            move = scroll = last_down = None
            continue
        if kind == 'mousemove':
            for name in ('x', 'y'):
                if not isinstance(e[name], (int, float)) or not math.isfinite(e[name]):
                    raise ValueError('invalid mouse coordinates')
            if move and all(e[k] == move[k] for k in ('page', 'viewport_width', 'viewport_height')):
                dt = (e['timestamp'] - move['timestamp']) / 1000
                ds = math.hypot(e['x'] - move['x'], e['y'] - move['y'])
                if dt > 0:
                    speed.append(ds / dt); distance.append(ds)
                else:
                    zero_dt += 1
            move = e
        elif kind == 'keydown':
            if e['press_id'] in keys:
                raise ValueError('duplicate active keyboard press_id')
            if last_down is not None:
                down_intervals.append(e['timestamp'] - last_down)
            last_down = e['timestamp']
            keys[e['press_id']] = e
        elif kind == 'keyup':
            down = keys.pop(e['press_id'], None)
            if down and down['key_category'] == e['key_category']:
                holds.append(e['timestamp'] - down['timestamp'])
        elif kind == 'mousedown':
            buttons[e['button']] = e['timestamp']
        elif kind == 'mouseup':
            down = buttons.pop(e['button'], None)
            if down is not None:
                click_holds.append(e['timestamp'] - down)
        elif kind == 'scroll':
            if scroll and e['page'] == scroll['page']:
                scroll_distances.append(math.hypot(e['scroll_x'] - scroll['scroll_x'], e['scroll_y'] - scroll['scroll_y']))
            scroll = e
    unmatched += len(keys)
    result = {'duration_seconds': duration / 1000, 'event_count': len(events),
              'events_per_second': len(events) / (duration / 1000),
              'mouse_path_css_px': sum(distance), 'scroll_path_css_px': sum(scroll_distances)}
    for kind in ('mousemove', 'click', 'scroll', 'keydown', 'keyup'):
        result[kind + '_count'] = counts[kind]
    for values, prefix in ((speed, 'mouse_speed_css_px_s'), (holds, 'key_hold_ms'),
                           (down_intervals, 'keydown_interval_ms'), (click_holds, 'mouse_hold_ms')):
        result.update(stats(values, prefix))
    return result, {'unmatched_keydowns': unmatched, 'zero_dt_mouse_pairs_skipped': zero_dt,
                    'equal_adjacent_timestamps': sum(a['timestamp'] == b['timestamp'] for a,b in zip(events, events[1:]))}

def sources(path):
    if path.is_dir():
        for p in sorted(path.rglob('*.json')):
            yield str(p), p.read_bytes()
    elif zipfile.is_zipfile(path):
        # Read in memory; never extract untrusted archive paths.
        with zipfile.ZipFile(path) as archive:
            for item in archive.infolist():
                if item.filename.endswith('.json'):
                    if item.file_size > 30_000_000:
                        raise ValueError('session exceeds 30MB limit')
                    yield item.filename, archive.read(item)
    else:
        yield str(path), path.read_bytes()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output', default='behavior_output', type=Path)
    args = parser.parse_args()
    rows, report, ids, hashes = [], [], set(), set()
    for name, raw in sources(args.input):
        try:
            session = json.loads(raw)
            sid = session['session_id']
            digest = hashlib.sha256(json.dumps(session['events'], sort_keys=True).encode()).hexdigest()
            if sid in ids or digest in hashes:
                raise ValueError('duplicate session ID or event stream')
            ids.add(sid); hashes.add(digest)
            features, quality = extract(session)
            integrity = session.get('integrity', {})
            if integrity.get('event_count') != len(session['events']):
                raise ValueError('stored event count mismatch')
            warnings = []
            if session.get('status') != 'complete' or not integrity.get('acknowledged_complete'):
                warnings.append('incomplete recording')
            if session.get('quality', {}).get('client_counters', {}).get('dropped_events', 0):
                warnings.append('reported dropped events')
            if features['key_hold_ms_count'] < 20:
                warnings.append('sparse keyboard coverage (pilot review heuristic)')
            rows.append({'session_id': sid, 'original_participant_id': session['participant_id'],
                         'participant_id': None, 'evaluation_eligible': False,
                         'purpose': 'pilot_only_identity_unknown', 'feature_version': VERSION,
                         'input_device': session.get('input_device'),
                         'label': session.get('behavior_label'), 'features': features})
            report.append({'source': name, 'session_id': sid, 'status': 'processed', 'warnings': warnings, **quality})
        except (ValueError, KeyError, TypeError) as exc:
            report.append({'source': name, 'status': 'rejected', 'error': str(exc)})
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'features.jsonl').write_text(''.join(json.dumps(r, allow_nan=False) + '\n' for r in rows), encoding='utf-8')
    (args.output / 'validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f'Processed {len(rows)} sessions; rejected {sum(r["status"] == "rejected" for r in report)}.')
    print(f'Outputs: {args.output.resolve()}')
    print('Pilot only: participant identity unknown. No training accuracy is claimed.')

if __name__ == '__main__':
    main()
