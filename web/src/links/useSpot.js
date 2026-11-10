import { useCallback, useEffect, useRef, useState } from 'react';
const sameHost = (a, b) => { try {
    return new URL(a).host.replace(/^www\./, '') === new URL(b).host.replace(/^www\./, '');
}
catch {
    return false;
} };
export const samePage = (a, b) => { try {
    const x = new URL(a), y = new URL(b);
    return sameHost(a, b) && x.pathname.replace(/\/$/, '') === y.pathname.replace(/\/$/, '');
}
catch {
    return false;
} };
/**
 * Talks to the site frame through its Braindy bridge (public/braindy-bridge.js): takes it to a page and outlines a part,
 * turns comment mode on (the next click on the site picks a part) and draws the comment pins of the page shown.
 * Without a bridge the frame still lands on the page; commenting needs the bridge.
 */
export function useSpot(siteUrl) {
    const frame = useRef(null);
    const current = useRef(siteUrl); // page the frame shows, as last reported by the bridge (or as we loaded it)
    const bridge = useRef(false);
    const wantPick = useRef(false); // comment mode asked for before the bridge answered: turned on when it does
    const [hasBridge, setHasBridge] = useState(false);
    const pending = useRef(null);
    const pinsRef = useRef([]);
    const [page, setPage] = useState(siteUrl);
    const [note, setNote] = useState(null);
    const [active, setActive] = useState(null);
    const [picking, setPickingState] = useState(false);
    const [picked, setPicked] = useState(null);
    const [pinned, setPinned] = useState(null);
    const wait = useRef(0);
    const send = useCallback((msg) => {
        const w = frame.current?.contentWindow;
        if (!w)
            return;
        let origin = '*';
        try {
            origin = new URL(current.current).origin;
        }
        catch { /* keep * : the frame checks who asks */ }
        w.postMessage(msg, origin);
    }, []);
    const ask = useCallback((s) => {
        if (!s.spot) {
            setNote(null);
            return;
        }
        send({ type: 'braindy:spot', id: s.label, spot: s.spot, label: s.label });
        clearTimeout(wait.current);
        wait.current = window.setTimeout(() => setNote(bridge.current ? 'missing' : 'moved'), 2500);
    }, [send]);
    useEffect(() => {
        const onMsg = (e) => {
            if (e.source !== frame.current?.contentWindow || !e.data || typeof e.data.type !== 'string')
                return;
            const d = e.data;
            if (d.type === 'braindy:ready') {
                bridge.current = true;
                setHasBridge(true);
                current.current = String(d.url ?? current.current);
                setPage(current.current);
                send({ type: 'braindy:pins', pins: pinsRef.current });
                const p = pending.current;
                pending.current = null;
                if (p)
                    ask(p);
                if (wantPick.current) {
                    setPickingState(true);
                    send({ type: 'braindy:comment-mode', on: true });
                }
            }
            else if (d.type === 'braindy:spot-result') {
                clearTimeout(wait.current);
                setNote(d.found ? null : 'missing');
            }
            else if (d.type === 'braindy:picked') {
                wantPick.current = false;
                setPickingState(false);
                setPicked({ url: String(d.url ?? ''), selector: String(d.selector ?? ''), text: String(d.text ?? ''), x: Number(d.x ?? 0.5), y: Number(d.y ?? 0.5) });
            }
            else if (d.type === 'braindy:comment-mode' && !d.on) {
                wantPick.current = false;
                setPickingState(false);
            }
            else if (d.type === 'braindy:pin')
                setPinned(String(d.id));
        };
        window.addEventListener('message', onMsg);
        return () => { window.removeEventListener('message', onMsg); clearTimeout(wait.current); };
    }, [ask, send]);
    const go = useCallback((s) => {
        setNote(null);
        setActive(s.label);
        const url = s.url && /^https?:\/\//.test(s.url) ? s.url : '';
        if (url && !sameHost(url, siteUrl) && !sameHost(url, current.current)) {
            if (!s.auto)
                window.open(url, '_blank', 'noreferrer');
            return;
        }
        if (url && !samePage(url, current.current)) {
            pending.current = s;
            current.current = url;
            setPage(url);
            if (frame.current)
                frame.current.src = url;
            // No bridge on the site: nothing will answer; the move itself is the result.
            clearTimeout(wait.current);
            wait.current = window.setTimeout(() => { if (pending.current === s) {
                pending.current = null;
                setNote(s.spot ? 'moved' : null);
            } }, 6000);
            return;
        }
        ask(s);
    }, [ask, siteUrl]);
    const setPicking = useCallback((on) => {
        wantPick.current = on;
        // No bridge (yet): nothing to point at; comments still work as general ones. If it answers later, comment mode follows.
        if (on && !bridge.current)
            return;
        setNote(null);
        setPicked(null);
        setPickingState(on);
        send({ type: 'braindy:comment-mode', on });
    }, [send]);
    const setPins = useCallback((pins) => { pinsRef.current = pins; send({ type: 'braindy:pins', pins }); }, [send]);
    return {
        frame, go, note, active, page, hasBridge, dismiss: () => setNote(null),
        picking, setPicking, picked, clearPicked: () => setPicked(null), setPins, pinned, clearPinned: () => setPinned(null),
    };
}
