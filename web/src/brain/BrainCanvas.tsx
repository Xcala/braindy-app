import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { AREAS, type Area } from './knowledge';
import type { BrainKind } from './useBrainEvents';
import type { Item, ItemKind } from './items';

/** The canvas is always dark (a lit brain reads best on night), so its colors are fixed, not theme tokens. */
export const KIND_COLOR: Record<BrainKind, string> = {
  request: '#8FA0FF', approved: '#3CCB8B', changed: '#FF8A8E', identity: '#5FD6EA',
  file: '#F5C04A', session: '#B89CFF', meeting: '#B89CFF', signed: '#FFFFFF', taught: '#F5B301', forgot: '#8B93A7',
};
const ITEM_COLOR: Partial<Record<ItemKind, string>> = { liked: '#3CCB8B', changed: '#FF8A8E', request: '#8FA0FF', rule: '#FFFFFF', talk: '#B89CFF', file: '#F5C04A' };
const ANGLE: Record<Area, number> = { identity: -150, voice: -90, strategy: -30, work: 30, rules: 90, talks: 150 };
/** Fewer than this many things in an area and it shows as a gap («teach it»). */
export const THIN = 3;

type P = { x: number; y: number; u: number; v: number; ph: number; born: number };
export type CanvasProps = {
  items: Item[]; degree: Map<string, number>; color: string; selected: string | null; focus: Area | null;
  /** Lit things (a search, or what goes into each piece); null lights everything. */
  lit: Set<string> | null; cutoff: Date | null;
  onPick: (id: string | null) => void; onArea: (a: Area | null) => void; onTeach: (a: Area) => void;
};

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; };
const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };

/** A brand color that stays visible on the night canvas (dark colors are lifted toward white). */
export function brainColor(hex?: string) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return '#8FA0FF';
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  if (lum >= 0.35) return hex;
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * 0.55).toString(16).padStart(2, '0')).join('')}`;
}

/** The Brand Brain as a map: every dot is one thing it knows, every line a real link. Tap a dot, an area or a gap. */
export function BrainCanvas(props: CanvasProps) {
  const { t } = useI18n();
  const stage = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const labels = useRef<Partial<Record<Area, HTMLButtonElement | null>>>({});
  const live = useRef(props); live.current = props;
  const g = useRef({ W: 0, H: 0, cx: 0, cy: 0, rx: 0, ry: 0, pos: new Map<string, P>(), seen: new Set<string>(), first: true, z: 1, zx: 0, zy: 0, hover: null as string | null });
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const place = (p: P) => {
    const s = g.current; const pinch = 1 - 0.12 * Math.exp(-Math.pow(Math.cos(p.u) * 3, 2));
    p.x = s.cx + Math.cos(p.u) * s.rx * p.v * pinch; p.y = s.cy + Math.sin(p.u) * s.ry * p.v;
  };
  const posOf = (it: Item) => {
    const s = g.current; let p = s.pos.get(it.id);
    if (!p) {
      const r = hash(it.id);
      p = { u: (ANGLE[it.area] + (r() - 0.5) * 54) * Math.PI / 180, v: 0.2 + Math.sqrt(r()) * 0.78, ph: r() * 6.28, x: 0, y: 0, born: s.first || reduce ? -1e9 : performance.now() };
      place(p); s.pos.set(it.id, p);
    }
    return p;
  };
  const visible = (it: Item) => { const c = live.current.cutoff; return !it.retired && (!c || !it.at || it.at <= c); };
  const toWorld = (x: number, y: number) => { const s = g.current; return [(x - s.zx) / s.z, (y - s.zy) / s.z] as const; };
  const nearest = (x: number, y: number) => {
    const [wx, wy] = toWorld(x, y); let best: string | null = null, bd = (14 / g.current.z) ** 2;
    for (const it of live.current.items) { if (!visible(it)) continue; const p = posOf(it); const d = (p.x - wx) ** 2 + (p.y - wy) ** 2; if (d < bd) { bd = d; best = it.id; } }
    return best;
  };

  useEffect(() => {
    const el = stage.current!, canvas = cv.current!, ctx = canvas.getContext('2d')!;
    const geom = () => {
      const b = el.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), s = g.current;
      s.W = b.width; s.H = b.height; canvas.width = s.W * dpr; canvas.height = s.H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.cx = s.W / 2; s.cy = s.H / 2; s.rx = Math.min(s.W * 0.36, s.H * 0.62); s.ry = s.H * 0.33;
      s.pos.forEach(place);
    };
    geom();
    const ro = new ResizeObserver(geom); ro.observe(el);
    let raf = 0;
    const draw = (now: number) => {
      const s = g.current, P = live.current, c = P.color, sel = P.selected;
      // Zoom toward the focused area (eased), labels follow.
      const fz = P.focus ? 1.9 : 1, ang = P.focus ? ANGLE[P.focus] * Math.PI / 180 : 0;
      const tx = P.focus ? s.cx - (s.cx + Math.cos(ang) * s.rx * 0.55) * fz : 0, ty = P.focus ? s.cy - (s.cy + Math.sin(ang) * s.ry * 0.55) * fz : 0;
      const k = reduce ? 1 : 0.12; s.z += (fz - s.z) * k; s.zx += (tx - s.zx) * k; s.zy += (ty - s.zy) * k;
      const dpr = Math.min(2, devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, s.W, s.H);
      ctx.setTransform(dpr * s.z, 0, 0, dpr * s.z, dpr * s.zx, dpr * s.zy);
      const glow = ctx.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, s.rx); glow.addColorStop(0, rgba(c, 0.12)); glow.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = glow; ctx.fillRect(0, 0, s.W, s.H);
      const items = P.items.filter(visible);
      const byId = new Map(items.map((x) => [x.id, x]));
      const per = Object.fromEntries(AREAS.map((a) => [a, items.filter((x) => x.area === a).length])) as Record<Area, number>;
      // Gaps: a dashed zone where it still knows little.
      ctx.setLineDash([3, 5]);
      for (const a of AREAS) {
        if (P.cutoff || per[a] >= THIN) continue; // the past is not a gap
        const an = ANGLE[a] * Math.PI / 180; ctx.strokeStyle = 'rgba(245,179,1,.45)';
        ctx.beginPath(); ctx.ellipse(s.cx + Math.cos(an) * s.rx * 0.6, s.cy + Math.sin(an) * s.ry * 0.6, s.rx * 0.2, s.ry * 0.24, 0, 0, 7); ctx.stroke();
      }
      ctx.setLineDash([]);
      const near = sel ? new Set([sel, ...(byId.get(sel)?.links ?? []), ...items.filter((x) => x.links.includes(sel)).map((x) => x.id)]) : null;
      const on = (id: string) => (near ? near.has(id) : !P.lit || P.lit.has(id));
      ctx.lineWidth = 1 / s.z;
      for (const it of items) for (const l of it.links) {
        const o = byId.get(l); if (!o) continue;
        const a = posOf(it), b = posOf(o), lit = on(it.id) && on(l);
        ctx.strokeStyle = rgba(lit && (near || P.lit) ? '#FFFFFF' : c, lit ? (near || P.lit ? 0.55 : 0.2) : 0.04);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (const it of items) {
        const p = posOf(it), lit = on(it.id), fresh = Math.max(0, 1 - (now - p.born) / 3000);
        const tw = reduce ? 1 : 0.8 + 0.2 * Math.sin(now / 900 + p.ph);
        const size = (it.used ? 2.4 : 1.6) + Math.min(3, (P.degree.get(it.id) ?? 0) * 0.5) + (it.kind === 'rule' ? 0.6 : 0);
        const col = it.hex && /^#[0-9a-f]{6}$/i.test(it.hex) ? it.hex : ITEM_COLOR[it.kind] ?? c;
        ctx.fillStyle = rgba(col, (lit ? (it.used ? 0.95 : 0.5) : 0.12) * tw);
        ctx.beginPath(); ctx.arc(p.x, p.y, size * (1 + fresh * 1.5) / Math.sqrt(s.z), 0, 7); ctx.fill();
        if (it.hex) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, size / Math.sqrt(s.z) + 1, 0, 7); ctx.stroke(); }
        if (fresh > 0) { ctx.strokeStyle = rgba(col, fresh); ctx.beginPath(); ctx.arc(p.x, p.y, 4 + (1 - fresh) * 30, 0, 7); ctx.stroke(); }
        if (it.id === sel || it.id === s.hover) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5 / s.z; ctx.beginPath(); ctx.arc(p.x, p.y, size + 4, 0, 7); ctx.stroke(); ctx.lineWidth = 1 / s.z; }
      }
      s.first = false;
      // Labels and the hover tip sit in screen space.
      for (const a of AREAS) {
        const l = labels.current[a]; if (!l) continue;
        const an = ANGLE[a] * Math.PI / 180, hw = l.offsetWidth / 2 + 8;
        const wx = s.cx + Math.cos(an) * (s.rx + Math.min(70, s.W * 0.09)), wy = s.cy + Math.sin(an) * (s.ry + 30);
        l.style.left = `${Math.max(hw, Math.min(s.W - hw, wx * s.z + s.zx))}px`; l.style.top = `${Math.max(18, Math.min(s.H - 18, wy * s.z + s.zy))}px`;
        const off = !!P.focus && P.focus !== a; l.style.opacity = off ? '0' : '1'; l.style.pointerEvents = off ? 'none' : ''; l.tabIndex = off ? -1 : 0;
      }
      const h = s.hover ? byId.get(s.hover) : null, tp = tip.current;
      if (tp) {
        if (h) { const p = posOf(h); tp.textContent = h.label; tp.style.left = `${p.x * s.z + s.zx}px`; tp.style.top = `${p.y * s.z + s.zy}px`; tp.classList.add('is-on'); } else tp.classList.remove('is-on');
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xy = (e: React.PointerEvent) => { const b = stage.current!.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top] as const; };
  const count = (a: Area) => props.items.filter((x) => x.area === a && visible(x)).length;
  return (
    <div className="bb-stage" ref={stage}
      onPointerMove={(e) => { const id = nearest(...xy(e)); g.current.hover = id; stage.current!.style.cursor = id ? 'pointer' : 'default'; }}
      onPointerLeave={() => { g.current.hover = null; }}
      onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; props.onPick(nearest(...xy(e as unknown as React.PointerEvent))); }}>
      <canvas ref={cv} aria-hidden="true" />
      <div className="bb-tip" ref={tip} aria-hidden="true" />
      {AREAS.map((a) => {
        const n = count(a), gap = n < THIN && !props.cutoff;
        return (
          <button key={a} type="button" className={`bb-rl${props.focus === a ? ' is-on' : ''}${gap ? ' is-gap' : ''}`} ref={(el) => { labels.current[a] = el; }}
            aria-pressed={props.focus === a} onClick={() => (gap ? props.onTeach(a) : props.onArea(props.focus === a ? null : a))}>
            {t(`bb.area.${a}` as 'bb.area.identity')}<b>{gap ? t('bb.teachShort') : n}</b>
          </button>
        );
      })}
    </div>
  );
}
