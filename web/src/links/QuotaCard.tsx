import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { money } from '../billing/useBilling';
import { buyPack, type AdjustQuota } from './useAdjustQuota';

/**
 * The month's Braindy credits for site adjustments, the way credit apps show them: spent and available over one bar,
 * what that is in small adjustments, and «Need more? Top up» (Stripe). In the account menu (full) and at the top of the
 * site's Adjust tab (compact).
 */
export function QuotaCard({ brandId, quota, compact }: { brandId: string; quota: AdjustQuota; compact?: boolean }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const total = quota.limit + quota.extra;
  const spent = quota.used + quota.held;
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 100;
  const date = new Date(`${quota.resets}T12:00:00Z`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long' });
  const price = money(quota.pack.price, quota.pack.currency, lang);
  const n = (v: number) => v.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US');
  const about = Math.floor(quota.left / quota.per);
  const out = quota.left < quota.per;
  async function buy() {
    setBusy(true); setErr(false);
    try { await buyPack(brandId); } catch { setErr(true); setBusy(false); }
  }

  if (total === 0) {
    return (
      <div className={`quota${compact ? ' is-compact' : ''}`}>
        <p className="quota-head"><QuotaIcon />{t('q.title')}</p>
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t('q.none')} <Link to="/plan?tab=site" className="quota-link">{t('q.upgrade')}</Link></p>
      </div>
    );
  }
  return (
    <div className={`quota${compact ? ' is-compact' : ''}${out ? ' is-out' : pct >= 80 ? ' is-low' : ''}`}>
      <p className="quota-head"><QuotaIcon />{t('q.title')}</p>
      <div className="quota-nums">
        <span><span className="t-mute">{t('q.used')}</span> <b>{n(spent)}</b></span>
        <span><span className="t-mute">{t('q.left')}</span> <b>{n(quota.left)}</b></span>
      </div>
      <div className="quota-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={spent}
        aria-label={t('q.of', { left: n(quota.left), total: n(total) })}><span style={{ width: `${pct}%` }} /></div>
      {out
        ? <p className="t-sm quota-out" style={{ margin: 0 }}>{t('q.full', { date })}</p>
        : <p className="t-xs t-mute" style={{ margin: 0 }}>{t('q.about', { n: String(about) })} · {t('q.resets', { date })}</p>}
      {!compact && <p className="t-xs t-mute" style={{ margin: 0 }}>{t('q.sizes')}</p>}
      {quota.held > 0 && !compact && <p className="t-xs t-mute" style={{ margin: 0 }}>{t('q.held', { n: String(quota.held / quota.per), c: n(quota.per) })}</p>}
      <p className="t-sm" style={{ margin: 0 }}>
        {t('q.more')}{' '}
        <button type="button" className="quota-link" onClick={buy} disabled={busy}>{busy ? '…' : t('q.buy', { credits: n(quota.pack.credits), price })}</button>
      </p>
      {err && <p className="help err" role="alert" style={{ margin: 0 }}>{t('q.buyErr')}</p>}
    </div>
  );
}

function QuotaIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="9" cy="14" r="6" /><path d="M13.5 4.6A6 6 0 1 1 17 15.6" /></svg>;
}
