import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { HomeMeetings } from './HomeMeetings';

type Next = { title: string; start: string | null; end: string | null; link: string | null };

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
const googleUrl = (m: Next, brand: string) =>
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title || `Braindy · ${brand}`)}&dates=${stamp(m.start!)}/${stamp(m.end ?? m.start!)}${m.link ? `&details=${encodeURIComponent(m.link)}&location=${encodeURIComponent(m.link)}` : ''}`;
const icsUrl = (m: Next, brand: string) => `data:text/calendar;charset=utf-8,${encodeURIComponent([
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Braindy//Home//ES', 'BEGIN:VEVENT', `UID:${stamp(m.start!)}-${brand.replace(/\W/g, '')}@braindy.co`,
  `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(m.start!)}`, `DTEND:${stamp(m.end ?? m.start!)}`,
  `SUMMARY:${(m.title || `Braindy · ${brand}`).replace(/[,;\n]/g, ' ')}`, ...(m.link ? [`LOCATION:${m.link}`, `URL:${m.link}`] : []), 'END:VEVENT', 'END:VCALENDAR',
].join('\r\n'))}`;

/** Meetings row: the next meeting (with add-to-my-calendar) and the history with each meeting's notes. */
export function HomeMeetingsRow({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const admin = profile?.role === 'admin';
  const [next, setNext] = useState<{ connected: boolean; next: Next | null } | null>(null);
  const [cal, setCal] = useState<{ ready: boolean; connected: boolean } | null>(null);
  useEffect(() => {
    api<{ connected: boolean; next: Next | null }>(`/v1/brands/${brandId}/meetings/next`).then(setNext).catch(() => setNext({ connected: false, next: null }));
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
      <div className="min-w-0 lg:col-span-3"><HomeMeetings brandId={brandId} admin={admin} /></div>
    </div>
  );
}
