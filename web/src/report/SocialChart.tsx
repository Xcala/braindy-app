import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { DailyKey, NetStats } from './useSocialStats';
import { series, type Range } from './socialMath';

const METRICS: DailyKey[] = ['views', 'reach', 'interactions', 'followers', 'engaged', 'pageViews'];
const H = 220, PAD = { l: 44, r: 8, t: 12, b: 26 };

/** One measure over the period: bars for what adds up, a line for followers. One series, one axis; hover shows the value. */
export function SocialChart({ net, range, keys }: { net: NetStats; range: Range; keys: Set<DailyKey> }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const options = METRICS.filter((m) => keys.has(m));
  const [pick, setPick] = useState<DailyKey>(options[0] ?? 'views');
  const metric = options.includes(pick) ? pick : options[0]!;
  const [hover, setHover] = useState<number | null>(null);
  // Drawn at its real width so labels stay 11px on a phone and on a wide screen.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e!.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!metric) return null;
  const { unit, points } = series(net.daily, metric, range);
  const vals = points.map((p) => p.v ?? 0);
  const line = metric === 'followers';
  const lo = line ? Math.min(...points.filter((p) => p.v != null).map((p) => p.v!)) : 0;
  const hi = Math.max(1, ...vals);
  const base = line ? Math.max(0, Math.floor(lo - (hi - lo) * 0.2)) : 0;
  const top = hi === base ? hi + 1 : hi;
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const step = iw / Math.max(1, points.length);
  const y = (v: number) => PAD.t + ih - ((v - base) / (top - base)) * ih;
  const fmt = (v: number | null) => (v == null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v));
  const label = (k: string) => unit === 'month'
    ? new Date(`${k}-15T12:00:00`).toLocaleDateString(locale, { month: 'short', year: '2-digit' })
    : new Date(`${k}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const every = Math.max(1, Math.ceil(points.length / Math.max(3, Math.floor(W / 80))));
  const h = hover != null ? points[hover] : null;
  const path = points.map((p, i) => (p.v == null ? null : `${PAD.l + step * i + step / 2},${y(p.v)}`)).filter(Boolean).join(' L');

  return (
    <div ref={box} className="card col g12">
      <div className="row between g8 wrap">
        <h3 className="h3">{t(`soc.k.${metric}` as StringKey)} · {t(`soc.by.${unit}` as StringKey)}</h3>
        <div className="row g6 wrap print:hidden" role="group" aria-label={t('soc.metric')}>
          {options.map((m) => (
            <button key={m} type="button" aria-pressed={m === metric} onClick={() => setPick(m)} className={`btn btn-sm ${m === metric ? 'btn-primary' : 'btn-secondary'}`}>{t(`soc.k.${m}` as StringKey)}</button>
          ))}
        </div>
      </div>
      {points.length === 0 ? <p className="t-sm t-mute">{t('soc.noData')}</p> : (
        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${t(`soc.k.${metric}` as StringKey)}: ${points.map((p) => `${label(p.k)} ${fmt(p.v)}`).join(', ')}`} onMouseLeave={() => setHover(null)}>
            {[0, 0.5, 1].map((f) => {
              const v = base + (top - base) * f;
              return <g key={f}><line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} /><text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--graphite)">{fmt(v)}</text></g>;
            })}
            {line ? <path d={`M${path}`} fill="none" stroke="#2F4DE0" strokeWidth={2} /> : points.map((p, i) => {
              const bw = Math.max(2, step - 2), x = PAD.l + step * i + (step - bw) / 2, v = p.v ?? 0;
              return <rect key={p.k} x={x} y={y(v)} width={bw} height={Math.max(0, PAD.t + ih - y(v))} rx={Math.min(4, bw / 2)} fill="#2F4DE0" opacity={hover == null || hover === i ? 1 : 0.45} />;
            })}
            {line && h?.v != null && <circle cx={PAD.l + step * hover! + step / 2} cy={y(h.v)} r={4} fill="#2F4DE0" stroke="#fff" strokeWidth={2} />}
            {points.map((p, i) => i % every === 0 && <text key={p.k} x={PAD.l + step * i + step / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--graphite)">{label(p.k)}</text>)}
            {points.map((p, i) => <rect key={`h${p.k}`} x={PAD.l + step * i} y={PAD.t} width={step} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />)}
          </svg>
          {h && (
            <div className="card t-xs" style={{ position: 'absolute', top: 0, left: `min(calc(${((PAD.l + step * hover! + step / 2) / W) * 100}% + 8px), calc(100% - 140px))`, padding: '6px 10px', pointerEvents: 'none', boxShadow: '0 4px 14px rgba(0,0,0,.08)' }}>
              <div className="t-mute">{unit === 'week' ? t('soc.weekOf', { d: label(h.k) }) : label(h.k)}</div>
              <div className="w7">{fmt(h.v)} {t(`soc.k.${metric}` as StringKey).toLowerCase()}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
