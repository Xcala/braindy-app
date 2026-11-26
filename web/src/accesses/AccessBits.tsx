import { useEffect, useState } from 'react';
import type { StringKey } from '../i18n/strings';
import { useI18n } from '../i18n/I18nProvider';
import { accessesApi, signInOf, type Access } from './useAccesses';
import { AppLogo } from './AppLogo';

/** "US$ 15 / mes": a subscription price as people read it. */
export function priceLabel(price: number, currency: string, period: 'month' | 'year' | 'usage' | 'once' | undefined, t: (k: StringKey) => string, lang: string) {
  const n = price.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { maximumFractionDigits: currency === 'COP' ? 0 : 2 });
  const sym = currency === 'COP' ? '$' : currency === 'EUR' ? '€' : 'US$';
  return `${sym} ${n}${currency === 'COP' ? ' COP' : ''}${period === 'once' ? ` · ${t('acc.once')}` : period === 'usage' ? ` · ${t('acc.usage')}` : ` / ${t(period === 'year' ? 'acc.perYear' : 'acc.perMonth')}`}`;
}

const fmt = (s: number) => `0:${String(s).padStart(2, '0')}`;
export const host = (url: string) => { try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; } };

/** A small copy button with "Copied" feedback. Copying a password is logged by the caller. */
export function CopyBtn({ value, onCopied, label }: { value: string; onCopied?: () => void; label: string }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn btn-ghost btn-sm flex-none" style={{ height: '1.875rem', width: '1.875rem', padding: 0 }} aria-label={label} title={done ? t('common.copied') : label}
      onClick={async () => { await navigator.clipboard.writeText(value).catch(() => undefined); setDone(true); onCopied?.(); setTimeout(() => setDone(false), 1800); }}>
      {done ? '✓' : <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>}
    </button>
  );
}

/** How you get in: Google / Outlook, or the password that reveals in place for 30 s (logged), or "Missing". */
export function PasswordCell({ brandId, a, onEdit }: { brandId: string; a: Access; onEdit: () => void }) {
  const { t } = useI18n();
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

  const signIn = signInOf(a);
  if (signIn !== 'password') {
    return <span className="row g8 t-sm w7"><AppLogo name={signIn} domain={signIn === 'google' ? 'google.com' : 'outlook.com'} size={20} />{t(signIn === 'google' ? 'acc.signInGoogle' : 'acc.signInMicrosoft')}</span>;
  }
  if (!a.hasSecret) return <span className="row g8"><span className="chip c-approve">{t('acc.missing')}</span><button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}>{t('acc.add')}</button></span>;
  return value ? (
    <span className="row g4 min-w-0">
      <span className="mono t-sm truncate" aria-live="polite">{value}</span>
      <span className="t-xs t-mute whitespace-nowrap" aria-label={t('acc.hidesIn', { time: fmt(left) })}>{fmt(left)}</span>
      <CopyBtn value={value} label={`${t('acc.copy')} · ${t('acc.password')}`} onCopied={() => accessesApi.copied(brandId, a.id).catch(() => undefined)} />
      <button type="button" className="btn btn-ghost btn-sm" style={{ height: '1.875rem', padding: '0 0.5rem' }} onClick={() => setValue(null)}>{t('acc.hide')}</button>
    </span>
  ) : (
    <span className="row g8 min-w-0">
      <span className="mono t-sm t-mute" aria-label={t('acc.encrypted')}>••••••••</span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={reveal}>{error ? t('acc.retry') : t('acc.revealPw')}</button>
    </span>
  );
}

/** The other cells, shared by the table row and the grid card. */
export function UserCell({ a }: { a: Access }) {
  const { t } = useI18n();
  return a.username
    ? <span className="row g4 min-w-0"><span className="t-sm truncate" title={a.username}>{a.username}</span><CopyBtn value={a.username} label={`${t('acc.copy')} · ${t('acc.user')}`} /></span>
    : <span className="t-sm t-mute">—</span>;
}
export function LinkCell({ a }: { a: Access }) {
  const { t } = useI18n();
  return a.link
    ? <span className="row g4 min-w-0"><a href={a.link} target="_blank" rel="noreferrer" className="t-sm truncate" style={{ color: 'var(--azul)' }}>{host(a.link)} ↗</a><CopyBtn value={a.link} label={`${t('acc.copy')} · ${t('acc.link')}`} /></span>
    : <span className="t-sm t-mute">—</span>;
}
export function PlanCell({ a }: { a: Access }) {
  const { t, lang } = useI18n();
  const s = a.subscription;
  return s
    ? <span className="col min-w-0"><span className="t-sm w7 truncate">{s.plan || t('acc.subscription')}</span>
      {s.price != null ? <span className="t-xs t-mute truncate">{priceLabel(s.price, s.currency ?? 'USD', s.period, t, lang)}</span> : s.period === 'usage' && <span className="t-xs t-mute truncate">{t('acc.usage')}</span>}
      {a.payer && <PayerChip payer={a.payer} />}</span>
    : a.payer ? <PayerChip payer={a.payer} /> : <span className="t-sm t-mute">—</span>;
}

/** Who pays the app: straight to the provider, or through Braindy. */
export function PayerChip({ payer }: { payer: 'braindy' | 'client' }) {
  const { t } = useI18n();
  return <span className={`acc-payer is-${payer}`}>{t(payer === 'client' ? 'acc.payClient' : 'acc.payBraindy')}</span>;
}

/** Six dots to drag the app to another place; ↑ ↓ on the keyboard do the same. */
export function DragHandle({ label, onMove }: { label: string; onMove: (step: -1 | 1) => void }) {
  return (
    <button type="button" className="acc-handle" aria-label={label} title={label}
      onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); onMove(e.key === 'ArrowUp' ? -1 : 1); } }}>
      <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor" aria-hidden="true">{[3, 8, 13].flatMap((y) => [2, 8].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.5" />))}</svg>
    </button>
  );
}
