import { useEffect, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';

type Sync = { state?: 'queued' | 'running' | 'done' | 'failed'; at?: Timestamp; doneAt?: Timestamp };

/** «Update»: asks for the latest from Metricool (2026-11-24). It leaves a request on the brand; the worker on NickMark's
 *  PC picks it up within seconds, copies the posts and marks it done, so this only shows the state. */
export function SyncButton({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [s, setS] = useState<Sync>({});
  const [err, setErr] = useState(false);
  useEffect(() => onSnapshot(doc(db, 'brands', brandId, 'syncRequests', 'social'), (d) => setS((d.data() as Sync) ?? {}), () => setS({})), [brandId]);
  const busy = s.state === 'queued' || s.state === 'running';
  const ask = async () => {
    if (!user || busy) return;
    setErr(false);
    try { await setDoc(doc(db, 'brands', brandId, 'syncRequests', 'social'), { at: serverTimestamp(), by: user.uid, state: 'queued' }); } catch { setErr(true); }
  };
  const when = s.doneAt?.toDate().toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const note = err || s.state === 'failed' ? t('cal.syncFail') : busy ? t('cal.syncing') : when ? t('cal.syncedAt', { when }) : '';
  return (
    <span className="cal-sync">
      {note && <span className={`t-xs ${err || s.state === 'failed' ? 'cal-sync-bad' : 't-mute'}`} aria-live="polite">{note}</span>}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => void ask()} disabled={busy} aria-busy={busy} title={t('cal.syncHint')}>
        <svg className={busy ? 'cal-spin' : ''} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" /></svg>
        {t(busy ? 'cal.syncBusy' : 'cal.sync')}
      </button>
    </span>
  );
}
