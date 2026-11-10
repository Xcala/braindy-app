import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { AREAS } from './knowledge';
/** The canvas is always dark (a lit brain reads best on night), so its colors are fixed, not theme tokens. */
export const KIND_COLOR = {
    request: '#8FA0FF', approved: '#3CCB8B', changed: '#FF8A8E', identity: '#5FD6EA',
    file: '#F5C04A', session: '#B89CFF', meeting: '#B89CFF', signed: '#FFFFFF',
};
const ANGLE = { identity: -150, voice: -90, strategy: -30, work: 30, rules: 90, talks: 150 };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
const mix = (h1, h2, k) => { const p = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }; const a = p(h1), b = p(h2); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`; };
/** A brand color that stays visible on the night canvas (dark colors are lifted toward white). */
export function brainColor(hex) {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex))
        return '#8FA0FF';
    const n = parseInt(hex.slice(1), 16);
    const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    if (lum >= 0.35)
        return hex;
    return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * 0.55).toString(16).padStart(2, '0')).join('')}`;
}
export const BrainCanvas = forwardRef(function BrainCanvas({ counts, color, showNumbers }, ref) {
    const { t } = useI18n();
    const stage = useRef(null);
    const cv = useRef(null);
    const labels = useRef({});
    const s = useRef({ W: 0, H: 0, cx: 0, cy: 0, rx: 0, ry: 0, nodes: [], edges: [], flights: [], rings: [], pulses: [], rnd: mulberry(7), color });
    s.current.color = color;
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const place = (n) => {
        const g = s.current;
        const pinch = 1 - 0.12 * Math.exp(-Math.pow(Math.cos(n.u) * 3, 2));
        n.x = g.cx + Math.cos(n.u) * g.rx * n.v * pinch;
        n.y = g.cy + Math.sin(n.u) * g.ry * n.v;
    };
    const addNode = (area, big = false, born = -1e9, kind) => {
        const g = s.current;
        const r = g.rnd;
        const n = { area, u: (ANGLE[area] + (r() - 0.5) * 56) * Math.PI / 180, v: 0.18 + Math.sqrt(r()) * 0.8, ph: r() * 6.28, size: big ? 3.2 : 1.6 + r() * 1.1, x: 0, y: 0, born, kind };
        place(n);
        g.nodes.push(n);
        g.nodes.filter((m) => m !== n).map((m) => [m, (m.x - n.x) ** 2 + (m.y - n.y) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, big ? 3 : 2)
            .forEach(([m]) => g.edges.push({ a: n, b: m, born }));
        if (r() < 0.18 && g.nodes.length > 8) {
            const m = g.nodes[Math.floor(r() * g.nodes.length)];
            if (m !== n)
                g.edges.push({ a: n, b: m, born, long: true });
        }
        return n;
    };
    const sync = (c) => { for (const a of AREAS) {
        const have = s.current.nodes.filter((n) => n.area === a).length;
        for (let i = have; i < c[a]; i++)
            addNode(a);
    } };
    useImperativeHandle(ref, () => ({
        sync,
        reset: () => { Object.assign(s.current, { nodes: [], edges: [], flights: [], rings: [], pulses: [], rnd: mulberry(11) }); },
        fill: (area, n) => { for (let i = 0; i < n; i++)
            addNode(area, false, performance.now()); },
        learn: (kind, area, opts) => {
            const g = s.current;
            const node = addNode(area, true, performance.now(), kind);
            node.hidden = true;
            const x0 = g.cx + (g.rnd() - 0.5) * g.W * 0.5, y0 = g.H + 10;
            g.flights.push({ x0, y0, mx: (x0 + node.x) / 2 + (g.rnd() - 0.5) * 120, my: Math.min(y0, node.y) + g.H * 0.15, node, kind, t0: performance.now(), dur: reduce ? 1 : opts?.fast ? 650 : 1300, done: opts?.done });
        },
    }));
    useEffect(() => {
        const el = stage.current, canvas = cv.current, ctx = canvas.getContext('2d');
        const geom = () => {
            const b = el.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), g = s.current;
            g.W = b.width;
            g.H = b.height;
            canvas.width = g.W * dpr;
            canvas.height = g.H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.cx = g.W / 2;
            g.cy = g.H / 2;
            g.rx = Math.min(g.W * 0.36, g.H * 0.62);
            g.ry = g.H * 0.33;
            for (const a of AREAS) {
                const l = labels.current[a];
                if (!l)
                    continue;
                const ang = ANGLE[a] * Math.PI / 180, hw = l.offsetWidth / 2 + 8;
                l.style.left = `${Math.max(hw, Math.min(g.W - hw, g.cx + Math.cos(ang) * (g.rx + Math.min(70, g.W * 0.09))))}px`;
                l.style.top = `${Math.max(18, Math.min(g.H - 18, g.cy + Math.sin(ang) * (g.ry + 30)))}px`;
            }
            g.nodes.forEach(place);
        };
        geom();
        const ro = new ResizeObserver(geom);
        ro.observe(el);
        let raf = 0;
        const draw = (now) => {
            const g = s.current, c = g.color;
            ctx.clearRect(0, 0, g.W, g.H);
            const glow = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.rx);
            glow.addColorStop(0, rgba(c, 0.12));
            glow.addColorStop(1, rgba(c, 0));
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, g.W, g.H);
            ctx.lineWidth = 1;
            for (const e of g.edges) {
                if (e.a.hidden || e.b.hidden)
                    continue;
                const fresh = Math.max(0, 1 - (now - e.born) / 2500);
                ctx.strokeStyle = rgba(c, (e.long ? 0.06 : 0.14) + fresh * 0.5);
                ctx.beginPath();
                ctx.moveTo(e.a.x, e.a.y);
                ctx.lineTo(e.b.x, e.b.y);
                ctx.stroke();
            }
            if (!reduce && g.edges.length && Math.random() < 0.06) {
                const e = g.edges[Math.floor(Math.random() * g.edges.length)];
                if (!e.a.hidden && !e.b.hidden)
                    g.pulses.push({ e, t0: now });
            }
            g.pulses = g.pulses.filter((p) => {
                const k = (now - p.t0) / 900;
                if (k > 1)
                    return false;
                ctx.fillStyle = p.kind ? KIND_COLOR[p.kind] : 'rgba(255,255,255,.7)';
                ctx.beginPath();
                ctx.arc(p.e.a.x + (p.e.b.x - p.e.a.x) * k, p.e.a.y + (p.e.b.y - p.e.a.y) * k, p.kind ? 2.4 : 1.4, 0, 7);
                ctx.fill();
                return true;
            });
            for (const n of g.nodes) {
                if (n.hidden)
                    continue;
                const fresh = Math.max(0, 1 - (now - n.born) / 3500), tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(now / 900 + n.ph), size = n.size * (1 + fresh * 1.2);
                ctx.fillStyle = fresh > 0 && n.kind ? mix(KIND_COLOR[n.kind], c, 1 - fresh) : rgba(c, 0.55 + 0.45 * tw);
                ctx.beginPath();
                ctx.arc(n.x, n.y, size, 0, 7);
                ctx.fill();
                if (n.size > 3) {
                    ctx.strokeStyle = 'rgba(255,255,255,.3)';
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, size + 2.5, 0, 7);
                    ctx.stroke();
                }
            }
            g.rings = g.rings.filter((r) => {
                const k = (now - r.t0) / 1100;
                if (k > 1)
                    return false;
                ctx.strokeStyle = rgba(KIND_COLOR[r.kind], 1 - k);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(r.x, r.y, 4 + k * 34, 0, 7);
                ctx.stroke();
                ctx.lineWidth = 1;
                return true;
            });
            g.flights = g.flights.filter((f) => {
                const k = Math.min(1, (now - f.t0) / f.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
                const at = (q) => [(1 - q) ** 2 * f.x0 + 2 * (1 - q) * q * f.mx + q * q * f.node.x, (1 - q) ** 2 * f.y0 + 2 * (1 - q) * q * f.my + q * q * f.node.y];
                for (let i = 1; i <= 6; i++) {
                    const [tx, ty] = at(Math.max(0, e - i * 0.025));
                    ctx.fillStyle = rgba(KIND_COLOR[f.kind], 0.5 - i * 0.07);
                    ctx.beginPath();
                    ctx.arc(tx, ty, 3.2 - i * 0.35, 0, 7);
                    ctx.fill();
                }
                const [x, y] = at(e);
                ctx.fillStyle = KIND_COLOR[f.kind];
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 7);
                ctx.fill();
                if (k < 1)
                    return true;
                f.node.hidden = false;
                f.node.born = now;
                g.rings.push({ x: f.node.x, y: f.node.y, kind: f.kind, t0: now });
                g.edges.filter((ed) => ed.a === f.node).forEach((ed) => { ed.born = now; g.pulses.push({ e: ed, t0: now, kind: f.kind }); });
                const l = labels.current[f.node.area];
                if (l) {
                    l.classList.add('is-lit');
                    setTimeout(() => l.classList.remove('is-lit'), 1400);
                }
                f.done?.();
                return false;
            });
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (_jsxs("div", { className: "bb-stage", ref: stage, children: [_jsx("canvas", { ref: cv, "aria-hidden": "true" }), AREAS.map((a) => (_jsxs("div", { className: "bb-rl", ref: (el) => { labels.current[a] = el; }, children: [t(`bb.area.${a}`), showNumbers && _jsx("b", { children: counts[a] })] }, a)))] }));
});
