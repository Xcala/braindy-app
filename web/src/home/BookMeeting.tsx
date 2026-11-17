import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';

type Booked = { start: string; end: string; link: string | null };

/** Book 30 minutes with NickMark: pick a day, then a free time (shown in the person's own time zone). */
export function BookMeeting({ brandId, onClose }: { brandId: string; onClose: () => void }) {
  const { t, lang } = useI18n();
  const loc = lang === 'es' ? 'es-CO' : 'en-US';
  const [slots, setSlots] = useState<string[] | null>(null);
  const [connected, setConnected] = useState(true);
  const [day, setDay] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Booked | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const load = () => api<{ connected: boolean; slots: string[] }>(`/v1/brands/${brandId}/meetings/slots`)
    .then((r) => { setConnected(r.connected); setSlots(r.slots); }).catch(() => { setConnected(false); setSlots([]); });
  useEffect(() => { load(); }, [brandId]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>('button')?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('keydown', esc); prev?.focus(); };
  }, [onClose]);

  const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA');
  const days = useMemo(() => [...new Set((slots ?? []).map(dayKey))], [slots]);
  const current = day && days.includes(day) ? day : days[0];
  const times = (slots ?? []).filter((s) => dayKey(s) === current);
  const fmtDay = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });

  async function book() {
    if (!pick) return;
    setBusy(true); setError(null);
    try { setDone(await api<Booked>(`/v1/brands/${brandId}/meetings/book`, { method: 'POST', body: JSON.stringify({ start: pick }) })); }
    catch (e) {
      const m = String(e);
      setError(t(m.includes('409') ? 'bk.taken' : m.includes('429') ? 'bk.tooMany' : 'bk.error'));
      if (m.includes('409')) { setPick(null); load(); }
    } finally { setBusy(false); }
  }

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className="modal col g16 w-full max-w-[32.5rem]" role="dialog" aria-modal="true" aria-labelledby="bk-title">
        <div className="row between g8">
          <h2 className="h2" id="bk-title">{t('bk.title')}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t('common.cancel')}>✕</button>
        </div>
        {done ? (
          <div className="col g12">
            <p className="w7">{t('bk.done', { when: `${fmtDay(dayKey(done.start))} · ${fmtTime(done.start)}` })}</p>
            <p className="t-sm t-mute">{t('bk.doneSub')}</p>
            {done.link && <a className="btn btn-primary self-start" href={done.link} target="_blank" rel="noreferrer">{t('hg.join')}</a>}
          </div>
        ) : slots === null ? <p className="t-mute">{t('common.loading')}…</p>
          : !connected ? <p className="t-sm t-mute">{t('bk.notOpen')}</p>
            : !slots.length ? <p className="t-sm t-mute">{t('bk.none')}</p>
              : (
                <>
                  <p className="t-sm t-mute">{t('bk.sub', { tz: Intl.DateTimeFormat().resolvedOptions().timeZone })}</p>
                  <div className="seg seg-scroll" role="tablist" aria-label={t('bk.day')}>
                    {days.map((k) => <button key={k} type="button" role="tab" aria-selected={k === current} className={k === current ? 'is-on' : ''} onClick={() => { setDay(k); setPick(null); }}>{fmtDay(k)}</button>)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t('bk.time')}>
                    {times.map((s) => (
                      <button key={s} type="button" role="radio" aria-checked={pick === s} className={`btn btn-sm ${pick === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPick(s)}>{fmtTime(s)}</button>
                    ))}
                  </div>
                  {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
                  <button type="button" className="btn btn-primary self-end" disabled={!pick || busy} onClick={book}>
                    {busy ? `${t('common.loading')}…` : pick ? t('bk.confirm', { when: `${fmtDay(current!)} · ${fmtTime(pick)}` }) : t('bk.pick')}
                  </button>
                </>
              )}
      </div>
    </div>
  );
}
