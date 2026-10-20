import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { accessesApi, type Access } from './useAccesses';

const fmt = (s: number) => `0:${String(s).padStart(2, '0')}`;

/** Credential row (design 16): hidden by default, reveal after a check, 30 s countdown, copy is logged. */
export function AccessRow({ brandId, a, onEdit }: { brandId: string; a: Access; onEdit: () => void }) {
  const { t, lang } = useI18n();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value) return;
    const id = window.setInterval(() => setLeft((l) => {
      if (l <= 1) { setValue(null); return 0; }
      return l - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [value]);
  // Hide when the tab goes to the background.
  useEffect(() => {
    const onHide = () => document.hidden && setValue(null);
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  async function reveal() {
    setBusy(true); setError(false);
    try {
      const r = await accessesApi.reveal(brandId, a.id);
      setValue(r.value); setLeft(r.seconds); setAsking(false);
    } catch { setError(true); } finally { setBusy(false); }
  }
  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true); window.setTimeout(() => setCopied(false), 2000);
    accessesApi.copied(brandId, a.id).catch(() => undefined);
  }

  const date = a.updatedAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
  const sub = a.sharedWithBraindy ? t('acc.shared') : [date, a.updatedByName].filter(Boolean).join(' · ');

  return (
    <div className="trow min-w-[640px]" style={{ gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr) minmax(0,1.3fr)', minHeight: 64 }}>
      <button className="col text-left" onClick={onEdit} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', padding: 0 }} aria-label={`${t('acc.edit')} · ${a.platform}`}>
        <span className="w7 truncate">{a.platform}</span>
        <span className="t-xs t-mute truncate">{sub}</span>
      </button>
      <span className="t-sm truncate">{a.username || '—'}</span>
      <div className="row g8 between">
        {!a.hasSecret ? <><span className="chip c-approve">{t('acc.missing')}</span><button className="btn btn-secondary btn-sm" onClick={onEdit}>{t('acc.add')}</button></>
          : value ? (
            <>
              <span className="mono t-sm truncate" aria-live="polite">{value}</span>
              <span className="t-xs t-mute whitespace-nowrap" aria-label={t('acc.hidesIn', { time: fmt(left) })}>{fmt(left)}</span>
              <span className="row g4">
                <button className="btn btn-secondary btn-sm" onClick={copy}>{copied ? t('acc.copiedLogged') : t('acc.copy')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setValue(null)}>{t('acc.hide')}</button>
              </span>
            </>
          ) : (
            <>
              <span className="mono t-sm t-mute" aria-label={t('acc.encrypted')}>••••••••••••</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setAsking(true)}>{t('acc.reveal')}</button>
            </>
          )}
      </div>
      {asking && (
        <ConfirmDialog title={t('acc.revealTitle', { platform: a.platform })} confirmLabel={t('acc.reveal')} busy={busy}
          onConfirm={reveal} onCancel={() => setAsking(false)}>
          {t('acc.revealBody')}
          {error && <p className="t-sm" style={{ color: 'var(--danger)', marginTop: 8 }}>{t('acc.revealError')}</p>}
        </ConfirmDialog>
      )}
    </div>
  );
}
