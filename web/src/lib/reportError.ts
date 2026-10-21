// Sends browser errors to the backend (→ Cloud Error Reporting). Only message, stack and path:
// never form values, tokens or query strings. At most 10 per page load.
const API_URL = import.meta.env.VITE_API_URL ?? '';
const RELEASE = import.meta.env.VITE_RELEASE ?? 'dev';
let sent = 0;

export function reportError(err: unknown) {
  if (import.meta.env.DEV || sent >= 10) return;
  sent++;
  const e = err instanceof Error ? err : new Error(String(err));
  const body = JSON.stringify({ message: e.message, stack: e.stack ?? '', path: location.pathname, release: RELEASE });
  try {
    if (!navigator.sendBeacon?.(`${API_URL}/public/client-errors`, new Blob([body], { type: 'text/plain' }))) {
      fetch(`${API_URL}/public/client-errors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
    }
  } catch { /* never let reporting break the page */ }
}

export function installErrorReporting() {
  window.addEventListener('error', (e) => reportError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason));
}
