import React, { useEffect, useState } from 'react';
import { startReferenceRecorder } from '../behavioral/referenceRecorder';

const API = 'http://127.0.0.1:5006';

export default function EvoGuardLive({ children }) {
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('Starting monitoring...');

  useEffect(() => {
    let disposed = false;
    let busy = false;
    let controller = null;

    const stopRecorder = startReferenceRecorder(
      async (windowData) => {
        if (disposed || busy) return;

        busy = true;
        controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
          const response = await fetch(`${API}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(windowData),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`Scoring service returned ${response.status}`);
          }

          const data = await response.json();

          if (!disposed) {
            setResult(data);
            setMessage(
              data.status === 'scored'
                ? `Updated at ${new Date().toLocaleTimeString()}`
                : 'Monitoring active — more mouse movement and search typing needed.'
            );
          }
        } catch (error) {
          if (!disposed) {
            setResult(null);
            setMessage(
              `Scoring unavailable. Check the Python service on port 5006. ${error.message}`
            );
          }
        } finally {
          clearTimeout(timeout);
          busy = false;
        }
      },
      (status) => {
        if (!disposed) {
          setMessage(status);
          if (status.startsWith('Window skipped')) setResult(null);
        }
      }
    );

    return () => {
      disposed = true;
      stopRecorder();
      controller?.abort();
    };
  }, []);

  const scored = result?.status === 'scored';

  return (
    <>
      {children}

      <aside
        data-evoguard-panel
        data-evoguard-control="true"
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 9999,
          width: 300,
          background: '#13243b',
          color: '#ffffff',
          borderRadius: 10,
          padding: 16,
          boxShadow: '0 4px 16px #0003',
          fontSize: 13,
        }}
      >
        <strong>EvoGuard — Live behavior monitoring</strong>

        <p>Monitoring starts automatically when the site loads.</p>

        <div style={{ fontSize: 28, margin: '10px 0' }}>
          {scored ? `${result.risk_score} / 100` : 'Waiting for evidence'}
        </div>

        {scored && (
          <>
            <p>
              {result.comparison === 'closer_to_bot'
                ? 'Behavior is closer to bot references'
                : result.comparison === 'closer_to_human'
                ? 'Behavior is closer to human references'
                : 'Similar distance to both reference groups'}
            </p>

            <p>
              Closest bot pattern:{' '}
              {result.closest_bot_pattern.replace(/_/g, ' ')}
            </p>
          </>
        )}

        {result?.evidence && (
          <p>
            Mouse pairs: {result.evidence.mouse_pairs}
            {' | '}
            Keyboard pairs: {result.evidence.key_pairs}
          </p>
        )}

        <p aria-live="polite">{message}</p>

        <small>
          Movement and search-key timing only. No typed text or passwords.
          Similarity score; automatic blocking is disabled.
        </small>
      </aside>
    </>
  );
}