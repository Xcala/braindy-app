import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { onboardingApi } from './api';

/** Day 2 · Session with Nicolas (design 17): pick a slot, confirm, add to calendar. */
export function SessionPicker({ brandId, brandName, bookedAt }: { brandId: string; brandName: string; bookedAt?: Date | null }) {
  const { t, lang } = useI18n();
  const [slots, setSlots] = useState<string[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const fmt = (iso: string | Date) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });

  useEffect(() => { onboardingApi.slots(brandId).then((r) => setSlots(r.slots)).catch(() => setSlots([])); }, [brandId]);

  async function confirm() {
    if (!pick) return;
    setBusy(true); setError(null);
    try { await onboardingApi.book(brandId, pick); }
    catch (e) { setError(String(e).includes('409') ? t('ob.slotTaken') : t('ob.bookError')); onboardingApi.slots(brandId).then((r) => setSlots(r.slots)).catch(() => undefined); }
    finally { setBusy(false); }
  }

  const calUrl = (d: Date) => {
    const s = d.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const e = new Date(d.getTime() + 90 * 60000).toISOString().replace(/[-:]|\.\d{3}/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Braindy · ${brandName} · Nicolas`)}&dates=${s}/${e}`;
  };

  return (
    <div className="card col g12" style={{ padding: 22 }}>
      <div className="row between g8 wrap"><h2 className="h3">{bookedAt ? t('ob.sessionBooked') : t('ob.pickSlot')}</h2><span className="t-xs t-mute">{t('ob.timezone')}</span></div>
      {bookedAt ? (
        <div className="row g12 wrap">
          <span className="w7">{fmt(bookedAt)}</span>
          <a className="btn btn-secondary btn-sm" href={calUrl(bookedAt)} target="_blank" rel="noreferrer">{t('ob.addCalendar')}</a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((s) => (
              <button key={s} className={`btn btn-sm ${pick === s ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'center' }} aria-pressed={pick === s} onClick={() => setPick(s)}>{fmt(s)}</button>
            ))}
          </div>
          <div className="row g12 wrap">
            <button className="btn btn-primary" disabled={!pick || busy} onClick={confirm}>{pick ? t('ob.confirmSlot', { slot: fmt(pick) }) : t('ob.pickFirst')}</button>
            <span className="t-xs t-mute">{t('ob.videoCall')}</span>
          </div>
        </>
      )}
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
