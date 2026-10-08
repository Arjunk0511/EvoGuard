import React, { useEffect } from 'react';
import { startReferenceRecorder } from '../behavioral/referenceRecorder';
const API = 'http://127.0.0.1:5006';

export default function EvoGuardLive({ children }) {
  useEffect(() => {
    let disposed = false, stopRecorder = null, session = null, index = 0;
    let retryTimer = null;
    const controllers = new Set();
    async function post(path, body, token) {
      const controller = new AbortController();
      controllers.add(controller);
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(API + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(body), signal: controller.signal,
        });
        if (!response.ok) throw new Error(`IDS backend HTTP ${response.status}`);
        return await response.json();
      } finally { clearTimeout(timeout); controllers.delete(controller); }
    }
    async function start() {
      try {
        session = await post('/sessions', {});
        if (disposed) return;
        stopRecorder = startReferenceRecorder(async windowData => {
          const body = { session_id: session.session_id, window_index: index++, window: windowData };
          // One retry uses the same window index; backend deduplicates submissions.
          for (let attempt = 0; attempt < 2 && !disposed; attempt++) {
            try { await post('/windows', body, session.session_token); return; }
            catch (error) { if (!disposed && attempt === 1) console.warn('EvoGuard: window delivery failed', error.message); }
          }
        }, () => {});
      } catch (error) {
        if (!disposed) {
          console.warn('EvoGuard: backend unavailable; retrying connection.');
          retryTimer = setTimeout(start, 5000);
        }
      }
    }
    // Cancels React development StrictMode's first setup before a visit is created.
    const initialTimer = setTimeout(start, 0);
    return () => {
      disposed = true;
      clearTimeout(initialTimer); clearTimeout(retryTimer);
      if (stopRecorder) stopRecorder();
      controllers.forEach(controller => controller.abort());
    };
  }, []);
  return <>{children}</>;
}
