import { useCallback, useEffect, useRef, useState } from 'react';

/** What a triage point or comment points at: the page where it lives and the part of it (visible text or CSS selector). */
export type Spot = { url?: string; spot?: string; label: string; auto?: boolean }; // auto: opened by unfolding a point, never pops a tab
/** moved: we only took the frame to the page (the site has no bridge); missing: the bridge did not find the part; nobridge: cannot comment. */
export type SpotNote = 'moved' | 'missing' | 'nobridge' | null;
/** A part of the page clicked in comment mode. x, y: where inside that part, 0–1. */
export type Picked = { url: string; selector: string; text: string; x: number; y: number };
export type Pin = { id: string; n: number; selector?: string; text?: string; x?: number; y?: number; done?: boolean };

const sameHost = (a: string, b: string) => { try { return new URL(a).host.replace(/^www\./, '') === new URL(b).host.replace(/^www\./, ''); } catch { return false; } };
export const samePage = (a: string, b: string) => { try { const x = new URL(a), y = new URL(b); return sameHost(a, b) && x.pathname.replace(/\/$/, '') === y.pathname.replace(/\/$/, ''); } catch { return false; } };

/**
 * Talks to the site frame through its Braindy bridge (public/braindy-bridge.js): takes it to a page and outlines a part,
 * turns comment mode on (the next click on the site picks a part) and draws the comment pins of the page shown.
 * Without a bridge the frame still lands on the page; commenting needs the bridge.
 */
export function useSpot(siteUrl: string) {
  const frame = useRef<HTMLIFrameElement>(null);
  const current = useRef(siteUrl); // page the frame shows, as last reported by the bridge (or as we loaded it)
  const bridge = useRef(false);
  const wantPick = useRef(false); // comment mode asked for before the bridge answered: turned on when it does
  const [hasBridge, setHasBridge] = useState(false);
  const [editor, setEditor] = useState<string | null>(null); // the site's own editor, when it has one (it says so on ready)
  const [ready, setReady] = useState(0); // how many times the bridge said ready (each page or editor load)
  const [signedIn, setSignedIn] = useState<boolean | null>(null); // the sign-in handoff: null = not tried
  const pending = useRef<Spot | null>(null);
  const pinsRef = useRef<Pin[]>([]);
  const [page, setPage] = useState(siteUrl);
  const [note, setNote] = useState<SpotNote>(null);
  const [active, setActive] = useState<string | null>(null);
  const [picking, setPickingState] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const wait = useRef(0);

  const send = useCallback((msg: Record<string, unknown>) => {
    const w = frame.current?.contentWindow;
    if (!w) return;
    let origin = '*';
    try { origin = new URL(current.current).origin; } catch { /* keep * : the frame checks who asks */ }
    w.postMessage(msg, origin);
  }, []);

  const ask = useCallback((s: Spot) => {
    if (!s.spot) { setNote(null); return; }
    send({ type: 'braindy:spot', id: s.label, spot: s.spot, label: s.label });
    clearTimeout(wait.current);
    wait.current = window.setTimeout(() => setNote(bridge.current ? 'missing' : 'moved'), 2500);
  }, [send]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || !e.data || typeof e.data.type !== 'string') return;
      const d = e.data;
      if (d.type === 'braindy:ready') {
        bridge.current = true; setHasBridge(true); setReady((n) => n + 1);
        if (typeof d.editor === 'string' && sameHost(d.editor, siteUrl)) setEditor(d.editor);
        if (d.inEditor) return; // the editor itself: not a page of the site
        current.current = String(d.url ?? current.current); setPage(current.current);
        send({ type: 'braindy:pins', pins: pinsRef.current });
        const p = pending.current; pending.current = null;
        if (p) ask(p);
        if (wantPick.current) { setPickingState(true); send({ type: 'braindy:comment-mode', on: true }); }
      } else if (d.type === 'braindy:spot-result') {
        clearTimeout(wait.current);
        setNote(d.found ? null : 'missing');
      } else if (d.type === 'braindy:picked') {
        wantPick.current = false; setPickingState(false);
        setPicked({ url: String(d.url ?? ''), selector: String(d.selector ?? ''), text: String(d.text ?? ''), x: Number(d.x ?? 0.5), y: Number(d.y ?? 0.5) });
      } else if (d.type === 'braindy:comment-mode' && !d.on) { wantPick.current = false; setPickingState(false); }
      else if (d.type === 'braindy:pin') setPinned(String(d.id));
      else if (d.type === 'braindy:auth-result') setSignedIn(!!d.ok);
    };
    window.addEventListener('message', onMsg);
    return () => { window.removeEventListener('message', onMsg); clearTimeout(wait.current); };
  }, [ask, send, siteUrl]);

  const go = useCallback((s: Spot) => {
    setNote(null); setActive(s.label);
    const url = s.url && /^https?:\/\//.test(s.url) ? s.url : '';
    if (url && !sameHost(url, siteUrl) && !sameHost(url, current.current)) { if (!s.auto) window.open(url, '_blank', 'noreferrer'); return; }
    if (url && !samePage(url, current.current)) {
      pending.current = s;
      current.current = url; setPage(url);
      if (frame.current) frame.current.src = url;
      // No bridge on the site: nothing will answer; the move itself is the result.
      clearTimeout(wait.current);
      wait.current = window.setTimeout(() => { if (pending.current === s) { pending.current = null; setNote(s.spot ? 'moved' : null); } }, 6000);
      return;
    }
    ask(s);
  }, [ask, siteUrl]);

  const setPicking = useCallback((on: boolean) => {
    wantPick.current = on;
    // No bridge (yet): nothing to point at; comments still work as general ones. If it answers later, comment mode follows.
    if (on && !bridge.current) return;
    setNote(null); setPicked(null); setPickingState(on);
    send({ type: 'braindy:comment-mode', on });
  }, [send]);

  /** Loads a URL in the frame as it is (the site's editor, or back to a page): no spot, no note. */
  const load = useCallback((url: string) => { setNote(null); pending.current = null; if (frame.current) frame.current.src = url; }, []);

  const setPins = useCallback((pins: Pin[]) => { pinsRef.current = pins; send({ type: 'braindy:pins', pins }); }, [send]);

  return {
    frame, go, load, note, active, page, hasBridge, editor, ready, signedIn, post: send, dismiss: () => setNote(null),
    picking, setPicking, picked, clearPicked: () => setPicked(null), setPins, pinned, clearPinned: () => setPinned(null),
  };
}
export type SiteFrame = ReturnType<typeof useSpot>;
