import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { accessesApi, type Access } from './useAccesses';

export type AccessCol = 'user' | 'password' | 'link' | 'notes';
export const ALL_COLS: AccessCol[] = ['user', 'password', 'link', 'notes'];
const WIDTH: Record<AccessCol, string> = { user: 'minmax(0,1fr)', password: 'minmax(0,1.3fr)', link: 'minmax(0,0.9fr)', notes: 'minmax(0,1fr)' };
/** Grid template for the visible columns: platform first, the edit action last. */
export const gridFor = (cols: AccessCol[]) => ['minmax(0,1fr)', ...cols.map((c) => WIDTH[c]), '84px'].join(' ');

const fmt = (s: number) => `0:${String(s).padStart(2, '0')}`;
const host = (url: string) => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; } };

/** A small copy button with "Copied" feedback. Copying a password is logged by the caller. */
function CopyBtn({ value, onCopied, label }: { value: string; onCopied?: () => void; label: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn btn-ghost btn-sm flex-none" style={{ height: 30, width: 30, padding: 0 }} aria-label={label} title={done ? t('common.copied') : label}
      onClick={async () => { await navigator.clipboard.writeText(value).catch(() => undefined); setDone(true); onCopied?.(); setTimeout(() => setDone(false), 1800); }}>
      {done ? '✓' : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>}
    </button>
  );
}

/** Credential row: each visible column copies on its own; the password reveals in place for 30 s (logged). */
export function AccessRow({ brandId, a, cols, onEdit }: { brandId: string; a: Access; cols: AccessCol[]; onEdit: () => void }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
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
    try { const r = await accessesApi.reveal(brandId, a.id); setValue(r.value); setLeft(r.seconds); }
    catch { setError(true); } finally { setBusy(false); }
  }

  const date = a.updatedAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
  const sub = a.sharedWithBraindy ? t('acc.shared') : [date, a.updatedByName].filter(Boolean).join(' · ');

  const cell: Record<AccessCol, React.ReactNode> = {
    user: a.username
      ? <span className="row g4 min-w-0"><span className="t-sm truncate" title={a.username}>{a.username}</span><CopyBtn value={a.username} label={`${t('acc.copy')} · ${t('acc.user')}`} /></span>
      : <span className="t-sm t-mute">—</span>,
    password: !a.hasSecret
      ? <span className="row g8"><span className="chip c-approve">{t('acc.missing')}</span><button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}>{t('acc.add')}</button></span>
      : value ? (
        <span className="row g4 min-w-0">
          <span className="mono t-sm truncate" aria-live="polite">{value}</span>
          <span className="t-xs t-mute whitespace-nowrap" aria-label={t('acc.hidesIn', { time: fmt(left) })}>{fmt(left)}</span>
          <CopyBtn value={value} label={`${t('acc.copy')} · ${t('acc.password')}`} onCopied={() => accessesApi.copied(brandId, a.id).catch(() => undefined)} />
          <button type="button" className="btn btn-ghost btn-sm" style={{ height: 30, padding: '0 8px' }} onClick={() => setValue(null)}>{t('acc.hide')}</button>
        </span>
      ) : (
        <span className="row g8 min-w-0">
          <span className="mono t-sm t-mute" aria-label={t('acc.encrypted')}>••••••••</span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={reveal}>{error ? t('acc.retry') : t('acc.revealPw')}</button>
        </span>
      ),
    link: a.link
      ? <span className="row g4 min-w-0"><a href={a.link} target="_blank" rel="noreferrer" className="t-sm truncate" style={{ color: 'var(--azul)' }}>{host(a.link)} ↗</a><CopyBtn value={a.link} label={`${t('acc.copy')} · ${t('acc.link')}`} /></span>
      : <span className="t-sm t-mute">—</span>,
    notes: <span className="t-sm t-mute truncate" title={a.notes}>{a.notes || '—'}</span>,
  };

  return (
    <div className="trow" style={{ gridTemplateColumns: gridFor(cols), minHeight: 64, minWidth: 260 + cols.length * 170 }}>
      <span className="col min-w-0"><span className="w7 truncate">{a.platform}</span><span className="t-xs t-mute truncate">{sub}</span></span>
      {cols.map((c) => <div key={c} className="min-w-0">{cell[c]}</div>)}
      <button type="button" className="btn btn-ghost btn-sm justify-self-end" onClick={onEdit} aria-label={`${t('acc.edit')} · ${a.platform}`}>{t('acc.edit')}</button>
    </div>
  );
}
