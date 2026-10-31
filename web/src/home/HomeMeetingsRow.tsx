import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { dayLabel } from '../lib/dates';

type Next = { title: string; start: string | null; end: string | null; link: string | null };
type Past = { id: string; title: string; date: string; topics: string[]; people: number };

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
const googleUrl = (m: Next, brand: string) =>
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title || `Braindy · ${brand}`)}&dates=${stamp(m.start!)}/${stamp(m.end ?? m.start!)}${m.link ? `&details=${encodeURIComponent(m.link)}&location=${encodeURIComponent(m.link)}` : ''}`;
const icsUrl = (m: Next, brand: string) => `data:text/calendar;charset=utf-8,${encodeURIComponent([
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Braindy//Home//ES', 'BEGIN:VEVENT', `UID:${stamp(m.start!)}-${brand.replace(/\W/g, '')}@braindy.co`,
  `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(m.start!)}`, `DTEND:${stamp(m.end ?? m.start!)}`,
  `SUMMARY:${(m.title || `Braindy · ${brand}`).replace(/[,;\n]/g, ' ')}`, ...(m.link ? [`LOCATION:${m.link}`, `URL:${m.link}`] : []), 'END:VEVENT', 'END:VCALENDAR',
].join('\r\n'))}`;

/** Meetings row: the next meeting (with add-to-my-calendar) and the history (title, date, topics). */
export function HomeMeetingsRow({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const admin = profile?.role === 'admin';
  const [next, setNext] = useState<{ connected: boolean; next: Next | null } | null>(null);
  const [past, setPast] = useState<Past[]>([]);
  const [cal, setCal] = useState<{ ready: boolean; connected: boolean } | null>(null);
  useEffect(() => {
    api<{ connected: boolean; next: Next | null }>(`/v1/brands/${brandId}/meetings/next`).then(setNext).catch(() => setNext({ connected: false, next: null }));
    api<{ items: Past[] }>(`/v1/brands/${brandId}/meetings`).then((r) => setPast(r.items)).catch(() => setPast([]));
  }, [brandId]);
  useEffect(() => { if (admin) api<{ ready: boolean; connected: boolean }>('/v1/admin/calendar').then(setCal).catch(() => setCal(null)); }, [admin]);

  async function connect() {
    const r = await api<{ url: string }>('/v1/admin/calendar/connect', { method: 'POST', body: '{}' });
    window.location.href = r.url;
  }
  const m = next?.next;
  const start = m?.start ? new Date(m.start) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <section className="card col g12 hg-next min-w-0" aria-labelledby="h-next">
        <h2 className="h3" id="h-next">{t('hg.next')}</h2>
        {m && start ? (
          <>
            <div className="row g12">
              <span className="mdate" aria-hidden="true"><b>{start.getDate()}</b><span>{start.toLocaleDateString(lang, { month: 'short' }).replace('.', '')}</span></span>
              <span className="col" style={{ minWidth: 0 }}>
                <span className="w7">{start.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long' })} · {start.toLocaleTimeString(lang === 'es' ? 'es-CO' : 'en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                <span className="t-xs t-mute truncate">{m.title}</span>
              </span>
            </div>
            {m.link && <a className="btn btn-primary btn-sm" href={m.link} target="_blank" rel="noreferrer">{t('hg.join')}</a>}
            <a className="btn btn-secondary btn-sm" href={googleUrl(m, brandName)} target="_blank" rel="noreferrer">{t('hg.addGoogle')}</a>
            <a className="t-xs w7" href={icsUrl(m, brandName)} download="braindy-reunion.ics">{t('hg.addOther')}</a>
          </>
        ) : <p className="t-sm t-mute">{t('hg.noNext')}</p>}
        {admin && cal && !cal.connected && (
          <div className="col g6" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            {cal.ready ? <button type="button" className="btn btn-secondary btn-sm" onClick={connect}>{t('hg.connectCal')}</button> : null}
            <span className="t-xs t-mute">{t(cal.ready ? 'hg.connectCalSub' : 'hg.calNotReady')}</span>
          </div>
        )}
      </section>
      <section className="col g12 min-w-0 lg:col-span-3" aria-labelledby="h-history">
        <h2 className="h3" id="h-history">{t('hg.history')}</h2>
        {past.length === 0 ? <div className="card t-mute">{t('hg.noHistory')}</div> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {past.slice(0, 6).map((p) => {
              const d = new Date(`${p.date.slice(0, 10)}T12:00:00`);
              return (
                <article key={p.id} className="card row g12 min-w-0" style={{ alignItems: 'flex-start' }}>
                  <span className="mdate" aria-hidden="true"><b>{d.getDate()}</b><span>{d.toLocaleDateString(lang, { month: 'short' }).replace('.', '')}</span></span>
                  <span className="col g4 grow" style={{ minWidth: 0 }}>
                    <span className="w7 truncate">{p.title}</span>
                    <span className="t-xs t-mute">{dayLabel(p.date, lang)}{p.people ? ` · ${t('hg.people', { n: p.people })}` : ''}</span>
                    {p.topics.length > 0 && <span className="mtags">{p.topics.slice(0, 3).map((x) => <span key={x}>{x}</span>)}{p.topics.length > 3 && <span>+{p.topics.length - 3}</span>}</span>}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
