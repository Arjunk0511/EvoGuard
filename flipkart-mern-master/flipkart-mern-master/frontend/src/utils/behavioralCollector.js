/**
 * Place at: frontend/src/utils/behavioralCollector.js
 *
 * IMPORTANT: this frontend's package.json proxy points to
 * http://localhost:4000 (the flipkart-mern backend), NOT the EvoGuard
 * security gateway (server.js, default port 5000). A relative fetch
 * here would silently hit the wrong backend. Point directly at the
 * gateway via an env var, with a sane local default.
 *
 * Add to frontend/.env (create it if it doesn't exist):
 *   REACT_APP_EVOGUARD_GATEWAY_URL=http://localhost:5000
 *
 * Captures mouse + keystroke events in the format
 * BehavioralFeatureExtractor.extract() expects:
 *   mouse:    { type: 'mousemove'|'mousedown'|'mouseup'|'click', timestamp, x, y }
 *   keyboard: { type: 'keydown'|'keyup', timestamp, code }
 *
 * Two modes:
 *   - label: 'human' | 'bot'  -> POSTs to <gateway>/api/behavior/collect (dataset building only)
 *   - no label                -> POSTs to <gateway>/api/behavior/predict (live scoring)
 */

const GATEWAY_URL =
  process.env.REACT_APP_EVOGUARD_GATEWAY_URL || 'http://localhost:5000';

export class BehavioralCollector {
  constructor({ sessionId, label = null, flushIntervalMs = 5000, maxBufferSize = 500 }) {
    this.sessionId = sessionId;
    this.label = label;
    this.endpoint = label
      ? `${GATEWAY_URL}/api/behavior/collect`
      : `${GATEWAY_URL}/api/behavior/predict`;
    this.flushIntervalMs = flushIntervalMs;
    this.maxBufferSize = maxBufferSize;
    this.buffer = [];
    this._timer = null;

    this._onMouseMove = this._record.bind(this, 'mousemove');
    this._onMouseDown = this._record.bind(this, 'mousedown');
    this._onMouseUp = this._record.bind(this, 'mouseup');
    this._onClick = this._record.bind(this, 'click');
    this._onKeyDown = this._recordKey.bind(this, 'keydown');
    this._onKeyUp = this._recordKey.bind(this, 'keyup');
    this._flush = this._flush.bind(this);
  }

  start() {
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    window.addEventListener('mousedown', this._onMouseDown, { passive: true });
    window.addEventListener('mouseup', this._onMouseUp, { passive: true });
    window.addEventListener('click', this._onClick, { passive: true });
    window.addEventListener('keydown', this._onKeyDown, { passive: true });
    window.addEventListener('keyup', this._onKeyUp, { passive: true });
    this._timer = setInterval(this._flush, this.flushIntervalMs);
  }

  stop() {
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('click', this._onClick);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    if (this._timer) clearInterval(this._timer);
    this._flush();
  }

  _record(type, e) {
    this.buffer.push({ type, timestamp: performance.now(), x: e.clientX, y: e.clientY });
    if (this.buffer.length >= this.maxBufferSize) this._flush();
  }

  _recordKey(type, e) {
    // e.code is the physical key position (e.g. "KeyA") — never e.key,
    // so we capture rhythm/timing without ever recording what was typed.
    this.buffer.push({ type, timestamp: performance.now(), code: e.code });
    if (this.buffer.length >= this.maxBufferSize) this._flush();
  }

  _flush() {
    if (this.buffer.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      events: this.buffer,
      ...(this.label ? { label: this.label } : {}),
    };

    this.buffer = [];

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  }
}