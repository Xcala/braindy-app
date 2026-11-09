import { useMemo, useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { NetBadge, netInfo, PostThumb } from '../calendar/PostBits';
import { PostDetail } from '../calendar/PostDetail';
import { useSocialStats } from '../report/useSocialStats';
import { statFor } from '../report/askMore';
import { useSocialPosts, type SocialPost } from '../calendar/useSocialPosts';
import { MiniMonth, dayKey } from '../calendar/MiniMonth';
import '../calendar/calendar.css';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const DOT: Record<string, string> = { published: 'var(--success)', scheduled: 'var(--azul)', error: '#D93025', draft: 'var(--graphite)' };

/** Calendar: the brand's social media posts, published and scheduled, by month. View only; Metricool publishes. */
export function Calendar() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [net, setNet] = useState('');
  const [open, setOpen] = useState<SocialPost | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  // Weeks start on Monday; the grid covers whole weeks around the month.
  const start = useMemo(() => { const d = new Date(month); d.setDate(1 - ((d.getDay() + 6) % 7)); return d; }, [month]);
  const end = useMemo(() => { const d = new Date(month.getFullYear(), month.getMonth() + 1, 1); d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); return d; }, [month]);
  const { posts, loading } = useSocialPosts(current?.id, start, end);
  // Numbers next to each published post where Results is on (the rules keep them closed otherwise).
  const stats = useSocialStats(current?.id, !!current?.resultsOn);
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const nets = [...new Set(posts.flatMap((p) => p.networks.map((n) => n.network)))];
  const shown = net ? posts.filter((p) => p.networks.some((n) => n.network === net)) : posts;
  const byDay = new Map<string, SocialPost[]>();
  for (const p of shown) byDay.set(dayKey(p.date), [...(byDay.get(dayKey(p.date)) ?? []), p]);
  const days: Date[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  const inMonth = shown.filter((p) => p.date.getMonth() === month.getMonth());
  const count = (s: string) => inMonth.filter((p) => p.status === s).length;
  const today = dayKey(new Date());
  const move = (n: number) => { setSel(null); setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); };
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }));
  const time = (d: Date) => d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="col g24">
      <div className="col g8">
        <p className="label">{current.name}</p>
        <h1 className="h1"><span className="w9">{t('nav.calendar')}.</span> {t('cal.tagline')}</h1>
      </div>

      <div className="cal-bar">
        <div className="row g8">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => move(-1)} aria-label={t('cal.prev')}>‹</button>
          <h2 className="h3 cal-month" aria-live="polite">{cap(month.toLocaleDateString(locale, { month: 'long', year: 'numeric' }))}</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => move(1)} aria-label={t('cal.next')}>›</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSel(null); setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }}>{t('cal.today')}</button>
        </div>
        <p className="t-sm t-mute" style={{ margin: 0 }}>
          <span className="cal-dot is-published" /> {t('cal.nPublished', { n: count('published') })} · <span className="cal-dot is-scheduled" /> {t('cal.nScheduled', { n: count('scheduled') })}
          {count('error') > 0 && <> · <span className="cal-dot is-error" /> {t('cal.nError', { n: count('error') })}</>}
        </p>
      </div>
      {nets.length > 1 && (
        <div className="row g8 wrap" role="group" aria-label={t('cal.networks')}>
          <button type="button" className={`btn btn-sm ${!net ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={!net} onClick={() => setNet('')}>{t('cal.all')}</button>
          {nets.map((n) => <button key={n} type="button" className={`btn btn-sm ${net === n ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={net === n} onClick={() => setNet(net === n ? '' : n)}><NetBadge network={n} /> {netInfo(n).label}</button>)}
        </div>
      )}

      <div className="cal-grid" role="grid" aria-busy={loading}>
        {weekdays.map((w) => <div key={w} className="cal-wd" role="columnheader">{w}</div>)}
        {days.map((d) => {
          const list = byDay.get(dayKey(d)) ?? [];
          return (
            <div key={+d} role="gridcell" className={`cal-day${d.getMonth() !== month.getMonth() ? ' is-out' : ''}${dayKey(d) === today ? ' is-today' : ''}`}>
              <span className="cal-num">{d.getDate()}</span>
              {list.slice(0, 4).map((p) => (
                <button key={p.id} type="button" className={`cal-post is-${p.status}`} onClick={() => setOpen(p)}
                  aria-label={`${time(p.date)} · ${p.networks.map((n) => netInfo(n.network).label).join(', ')} · ${t(`cal.st.${p.status}`)}`}>
                  <PostThumb post={p} />
                  <span className="cal-post-meta"><span className="t-xs">{time(p.date)}</span><span className="cal-post-nets">{p.networks.map((n, i) => <NetBadge key={i} network={n.network} />)}</span></span>
                </button>
              ))}
              {list.length > 4 && <button type="button" className="cal-more" onClick={() => setOpen(list[4])}>+{list.length - 4}</button>}
            </div>
          );
        })}
      </div>

      <MiniMonth days={days} month={month} selected={sel} onSelect={setSel}
        dots={new Map([...byDay].map(([k, l]) => [k, l.map((p) => DOT[p.status] ?? DOT.draft)]))} />
      <div className="cal-agenda">
        {!sel && inMonth.length === 0 && !loading && <div className="card t-mute">{t('cal.empty')}</div>}
        {(sel ? [sel] : [...new Set(inMonth.map((p) => dayKey(p.date)))]).map((k) => {
          const list = byDay.get(k) ?? [];
          return (
            <section key={k} className="col g8">
              <h3 className="label" style={{ margin: 0 }}>{list[0].date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              {list.map((p) => (
                <button key={p.id} type="button" className={`card cal-row is-${p.status}`} onClick={() => setOpen(p)}>
                  <PostThumb post={p} />
                  <span className="col g4 min-w-0">
                    <span className="row g8"><span className="t-sm w7">{time(p.date)}</span>{p.networks.map((n, i) => <NetBadge key={i} network={n.network} />)}</span>
                    <span className="t-xs t-mute truncate">{p.text || p.title || t(`cal.st.${p.status}`)}</span>
                  </span>
                </button>
              ))}
            </section>
          );
        })}
      </div>
      {inMonth.length === 0 && !loading && <p className="t-sm t-mute cal-empty-desk">{t('cal.empty')}</p>}
      <p className="t-xs t-mute">{t('cal.note')}</p>
      {open && <PostDetail post={open} stat={statFor(stats.list, open)} onClose={() => setOpen(null)} />}
    </div>
  );
}
