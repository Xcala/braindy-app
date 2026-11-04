import { useCallback, useEffect, useRef, useState } from 'react';

/** What a triage point points at: the page where it was done and the part of it (visible text or CSS selector). */
export type Spot = { url?: string; spot?: string; label: string; auto?: boolean }; // auto: opened by unfolding the point, never pops a tab
/** moved: we only took the frame to the page (the site has no bridge); missing: the bridge did not find the part. */
export type SpotNote = 'moved' | 'missing' | null;

const sameHost = (a: string, b: string) => { try { return new URL(a).host.replace(/^www\./, '') === new URL(b).host.replace(/^www\./, ''); } catch { return false; } };
const samePage = (a: string, b: string) => { try { const x = new URL(a), y = new URL(b); return sameHost(a, b) && x.pathname.replace(/\/$/, '') === y.pathname.replace(/\/$/, ''); } catch { return false; } };

/**
 * Takes the site frame to a triage point: loads its page if needed, then asks the site's Braindy bridge
 * (public/braindy-bridge.js) to scroll to the part and outline it. Without a bridge the frame still lands on the page.
 */
export function useSpot(siteUrl: string) {
  const frame = useRef<HTMLIFrameElement>(null);
  const current = useRef(siteUrl); // page the frame shows, as last reported by the bridge (or as we loaded it)
  const bridge = useRef(false);
  const pending = useRef<Spot | null>(null);
  const [note, setNote] = useState<SpotNote>(null);
  const [active, setActive] = useState<string | null>(null);
  const wait = useRef(0);

  const ask = useCallback((s: Spot) => {
    const w = frame.current?.contentWindow;
    if (!w || !s.spot) { setNote(s.spot ? 'moved' : null); return; }
    let origin = '*';
    try { origin = new URL(current.current).origin; } catch { /* keep * : the frame checks who asks */ }
    w.postMessage({ type: 'braindy:spot', id: s.label, spot: s.spot, label: s.label }, origin);
    clearTimeout(wait.current);
    wait.current = window.setTimeout(() => setNote(bridge.current ? 'missing' : 'moved'), 2500);
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || !e.data || typeof e.data.type !== 'string') return;
      if (e.data.type === 'braindy:ready') {
        bridge.current = true;
        current.current = String(e.data.url ?? current.current);
        const p = pending.current; pending.current = null;
        if (p) ask(p);
      } else if (e.data.type === 'braindy:spot-result') {
        clearTimeout(wait.current);
        setNote(e.data.found ? null : 'missing');
      }
    };
    window.addEventListener('message', onMsg);
    return () => { window.removeEventListener('message', onMsg); clearTimeout(wait.current); };
  }, [ask]);

  const go = useCallback((s: Spot) => {
    setNote(null); setActive(s.label);
    const url = s.url && /^https:\/\//.test(s.url) ? s.url : '';
    if (url && !sameHost(url, siteUrl)) { if (!s.auto) window.open(url, '_blank', 'noreferrer'); return; }
    if (url && !samePage(url, current.current)) {
      pending.current = s;
      current.current = url;
      if (frame.current) frame.current.src = url;
      // No bridge on the site: nothing will answer; the move itself is the result.
      clearTimeout(wait.current);
      wait.current = window.setTimeout(() => { if (pending.current === s) { pending.current = null; setNote(s.spot ? 'moved' : null); } }, 6000);
      return;
    }
    ask(s);
  }, [ask, siteUrl]);

  return { frame, go, note, active, dismiss: () => setNote(null) };
}
