import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { billingApi, money } from '../../billing/useBilling';
import { useConfirm } from '../../components/useConfirm';
import { useToast } from '../../components/Toaster';
import { failedDays, type HostRow } from './SiteHostingAdmin';

export type Transfer = { id: string; brandId: string; reference: string; amount: number | null };

/** What comes in every month, split per currency (decision FA-A: never added up as one currency). COP first. */
export function recurring(rows: HostRow[], lang: 'en' | 'es') {
  const by = new Map<string, number>();
  for (const r of rows) if (r.status === 'active' && r.monthly) { const c = r.currency ?? 'usd'; by.set(c, (by.get(c) ?? 0) + r.monthly); }
  return [...by.entries()].sort(([a], [b]) => (a === 'cop' ? -1 : b === 'cop' ? 1 : a.localeCompare(b)))
    .map(([c, v]) => `${money(v, c, lang)}${c === 'usd' ? '' : ` ${c.toUpperCase()}`}`).join(' + ');
}

/** Admin › Billing · top (FA1): one card with what comes in each month, then «All clear» in one green line, or «To collect»
 *  with transfers to confirm and failed payments. «Confirm» asks first: the API has no way to undo a confirmed transfer. */
export function BillingDue({ rows, transfers, name, onOpen, reload }: {
  rows: HostRow[]; transfers: Transfer[]; name: (id: string) => string; onOpen: (brandId: string) => void; reload: () => void;
}) {
  const { t, lang } = useI18n();
  const [dialog, ask] = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const active = rows.filter((r) => r.status === 'active').length;
  const inMonth = recurring(rows, lang);
  const curOf = (brandId: string) => rows.find((r) => r.brandId === brandId)?.currency ?? 'usd';
  const failed = rows.filter((r) => r.status === 'past_due').map((r) => ({ r, text: t('bill.status.past_due') }));
  const siteFailed = rows.filter((r) => failedDays(r) != null && r.status !== 'past_due')
    .sort((a, b) => (failedDays(b) ?? 0) - (failedDays(a) ?? 0)).map((r) => ({ r, text: t('bill.a.failedSite', { d: failedDays(r)! }) }));
  const due = transfers.length + failed.length + siteFailed.length;

  async function confirm(x: Transfer) {
    const amount = money(x.amount, curOf(x.brandId), lang);
    if (!(await ask({ title: t('bill.a.confirmQ', { name: name(x.brandId) }), body: t('bill.a.confirmBody', { amount, ref: x.reference }), confirmLabel: t('bill.a.confirm') }))) return;
    setBusy(x.id);
    try { await billingApi.confirmTransfer(x.brandId, x.id); toast({ text: t('bill.a.confirmed', { name: name(x.brandId) }) }); reload(); }
    catch { toast({ text: t('bill.a.confirmErr'), tone: 'bad' }); }
    finally { setBusy(null); }
  }

  return (
    <>
      {dialog}
      <section className="card col g4" aria-labelledby="ba-in">
        <span className="t-sm t-mute w7" id="ba-in">{t('bill.a.inMonthly')}</span>
        <span className="ba-total">{inMonth || money(0, 'usd', lang)}</span>
        <span className="t-sm t-mute">{active === 0 ? t('bill.a.none') : active === 1 ? t('bill.a.active1') : t('bill.a.activeN', { n: active })}</span>
      </section>

      {due === 0 ? <p className="ba-clear" role="status">✓ {t('bill.a.allClear')}</p> : (
        <section className="card col g8 ba-due" aria-labelledby="ba-due">
          <h2 className="h3" id="ba-due">{t('bill.a.due', { n: due })}</h2>
          {transfers.map((x) => (
            <div key={x.id} className="ba-item">
              <span className="col" style={{ minWidth: 0 }}><b className="truncate">{name(x.brandId)}</b>
                <span className="t-xs t-mute">{t('bill.a.transferLine', { amount: money(x.amount, curOf(x.brandId), lang), ref: x.reference })}</span></span>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy === x.id} aria-busy={busy === x.id} onClick={() => void confirm(x)}>
                {busy === x.id ? t('bill.a.confirming') : t('bill.a.confirmShort')}
              </button>
            </div>
          ))}
          {[...failed, ...siteFailed].map(({ r, text }) => (
            <div key={`f-${r.brandId}`} className="ba-item">
              <span className="col" style={{ minWidth: 0 }}><b className="truncate">{name(r.brandId)}</b><span className="t-xs ba-bad">{text}</span></span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpen(r.brandId)}>{t('bill.a.see')}</button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
