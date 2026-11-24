import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { useNextPrefs } from './nextPrefs';
import { BookMeeting } from './BookMeeting';

export type Next = { title: string; start: string | null; end: string | null; link: string | null };

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
const googleUrl = (m: Next, brand: string) =>
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title || `Braindy · ${brand}`)}&dates=${stamp(m.start!)}/${stamp(m.end ?? m.start!)}${m.link ? `&details=${encodeURIComponent(m.link)}&location=${encodeURIComponent(m.link)}` : ''}`;
const icsUrl = (m: Next, brand: string) => `data:text/calendar;charset=utf-8,${encodeURIComponent([
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Braindy//Home//ES', 'BEGIN:VEVENT', `UID:${stamp(m.start!)}-${brand.replace(/\W/g, '')}@braindy.co`,
  `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(m.start!)}`, `DTEND:${stamp(m.end ?? m.start!)}`,
  `SUMMARY:${(m.title || `Braindy · ${brand}`).replace(/[,;\n]/g, ' ')}`, ...(m.link ? [`LOCATION:${m.link}`, `URL:${m.link}`] : []), 'END:VEVENT', 'END:VCALENDAR',
].join('\r\n'))}`;

/** The brand's next meeting, and whether the person closed the card for this one (it comes back for the next meeting). */
export function useNextMeeting(brandId: string) {
  const [data, setData] = useState<{ connected: boolean; next: Next | null } | null>(null);
  const [prefs, setPrefs] = useNextPrefs();
  useEffect(() => {
    api<{ connected: boolean; next: Next | null }>(`/v1/brands/${brandId}/meetings/next`).then(setData).catch(() => setData({ connected: false, next: null }));
  }, [brandId]);
  const key = data?.next?.start ?? 'none';
  return { data, key, closed: prefs.closedFor === key, prefs, setPrefs };
}

/** «Next meeting», with its own menu: make it small, move it to the top of Home or back, or close it. */
export function NextMeetingCard({ brandId, brandName, m, mkey }: { brandId: string; brandName: string; m: Next | null; mkey: string }) {
  const [booking, setBooking] = useState(false);
  const { t, lang } = useI18n();
  const admin = useAuth().profile?.role === 'admin';
  const [prefs, setPrefs] = useNextPrefs();
  const [cal, setCal] = useState<{ ready: boolean; connected: boolean } | null>(null);
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (admin) api<{ ready: boolean; connected: boolean }>('/v1/admin/calendar').then(setCal).catch(() => setCal(null)); }, [admin, brandId]);
  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [menu]);

  async function connect() {
    const r = await api<{ url: string }>('/v1/admin/calendar/connect', { method: 'POST', body: '{}' });
    window.location.href = r.url;
  }
  const start = m?.start ? new Date(m.start) : null;
  const loc = lang === 'es' ? 'es-CO' : 'en-US';
  const when = start && `${start.toLocaleDateString(loc, { weekday: 'long' })} · ${start.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' })}`;
  const pick = (patch: Parameters<typeof setPrefs>[0]) => { setPrefs(patch); setMenu(false); };

  const options = (
    <div ref={box} className="relative shrink-0">
      <button type="button" className="btn btn-ghost btn-sm nm-more" aria-haspopup="menu" aria-expanded={menu} aria-label={t('nm.menu')} onClick={() => setMenu((o) => !o)}>⋯</button>
      {menu && (
        <div className="menu absolute right-0 top-[2.5rem] z-40 flex w-[13.75rem] flex-col gap-0.5" role="menu" aria-label={t('nm.menu')}>
          <button type="button" role="menuitem" className="menu-item" onClick={() => pick({ small: !prefs.small })}>{t(prefs.small ? 'nm.big' : 'nm.small')}</button>
          <button type="button" role="menuitem" className="menu-item" onClick={() => pick({ top: !prefs.top })}>{t(prefs.top ? 'nm.back' : 'nm.top')}</button>
          <button type="button" role="menuitem" className="menu-item" onClick={() => pick({ closedFor: mkey })}>{t('nm.close')}</button>
        </div>
      )}
    </div>
  );

  if (prefs.small) {
    return (
      <section className="card row g12 hg-next min-w-0" style={{ padding: '0.625rem 0.75rem 0.625rem 1rem' }} aria-label={t('hg.next')}>
        <span className="col grow" style={{ minWidth: 0 }}>
          <span className="t-xs t-mute">{t('hg.next')}</span>
          <span className="w7 truncate">{when ?? t('hg.noNext')}</span>
        </span>
        {m?.link && <a className="btn btn-primary btn-sm shrink-0" href={m.link} target="_blank" rel="noreferrer">{t('hg.join')}</a>}
        {options}
      </section>
    );
  }

  return (
    <section className="card col g12 hg-next min-w-0" aria-labelledby="h-next">
      <div className="row between g8"><h2 className="h3" id="h-next">{t('hg.next')}</h2>{options}</div>
      {m && start ? (
        <>
          <div className="row g12">
            <span className="mdate" aria-hidden="true"><b>{start.getDate()}</b><span>{start.toLocaleDateString(lang, { month: 'short' }).replace('.', '')}</span></span>
            <span className="col" style={{ minWidth: 0 }}>
              <span className="w7">{when}</span>
              <span className="t-xs t-mute truncate">{m.title}</span>
            </span>
          </div>
          {m.link && <a className="btn btn-primary btn-sm" href={m.link} target="_blank" rel="noreferrer">{t('hg.join')}</a>}
          <a className="btn btn-secondary btn-sm" href={googleUrl(m, brandName)} target="_blank" rel="noreferrer">{t('hg.addGoogle')}</a>
          <a className="t-xs w7" href={icsUrl(m, brandName)} download="braindy-reunion.ics">{t('hg.addOther')}</a>
        </>
      ) : (
        <div className="col g8">
          <p className="t-sm t-mute">{t('hg.noNext')}</p>
          {!admin && <button type="button" className="btn btn-secondary btn-sm self-start" onClick={() => setBooking(true)}>{t('hg.book')}</button>}
        </div>
      )}
      {booking && <BookMeeting brandId={brandId} onClose={() => setBooking(false)} />}
      {admin && cal && !cal.connected && (
        <div className="col g6" style={{ borderTop: '1px solid var(--line)', paddingTop: '0.75rem' }}>
          {cal.ready ? <button type="button" className="btn btn-secondary btn-sm" onClick={connect}>{t('hg.connectCal')}</button> : null}
          <span className="t-xs t-mute">{t(cal.ready ? 'hg.connectCalSub' : 'hg.calNotReady')}</span>
        </div>
      )}
    </section>
  );
}
