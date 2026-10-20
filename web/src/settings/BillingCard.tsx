import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { billingApi, money, useBilling } from '../billing/useBilling';
import { CONTACT } from '../proposals/public/copy';
import type { StringKey } from '../i18n/strings';

const SERVICES: Array<{ key: string; title: StringKey; body: StringKey }> = [
  { key: 'social', title: 'bill.s.social', body: 'bill.s.socialBody' },
  { key: 'web', title: 'bill.s.web', body: 'bill.s.webBody' },
  { key: 'report', title: 'bill.s.report', body: 'bill.s.reportBody' },
  { key: 'agents', title: 'bill.s.agents', body: 'bill.s.agentsBody' },
  { key: 'print', title: 'bill.s.print', body: 'bill.s.printBody' },
];

/** Settings · Billing (design 20): plan, services, next charge, payment method, invoices, cancellation. */
export function BillingCard({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const { plan, invoices } = useBilling(brandId);
  const [cancel, setCancel] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (plan === undefined) return <div className="card t-mute">{t('common.loading')}…</div>;
  if (plan === null) return <div className="card col g8"><p className="t-mute">{t('bill.noPlan')}</p><a className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer">{t('home.talk')}</a></div>;
  const included = new Set(plan.path === 'continuity' || plan.path === 'transform' ? ['social', 'web', 'report', ...(plan.addons ?? [])] : plan.addons ?? []);
  const next = plan.nextChargeAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const go = async (fn: () => Promise<{ url: string }>) => { try { window.location.href = (await fn()).url; } catch { setMsg(t('bill.portalError')); } };

  return (
    <div className="col g24">
      <p className="t-mute">{t('bill.tagline')}</p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card col g12">
          <div className="row between g8 wrap">
            <div className="col"><span className="label">{t('bill.yourPlan')}</span><span className="h2">{t(`bill.path.${plan.path ?? 'transform'}`)}</span><span className="t-sm t-mute">{t(`bill.pathSub.${plan.path ?? 'transform'}`)}</span></div>
            <span className={`chip ${plan.status === 'active' ? 'c-active' : plan.status === 'past_due' ? 'c-lost' : 'c-draft'}`}>{t(`bill.status.${plan.status ?? 'pending'}`)}</span>
          </div>
          {SERVICES.map((s) => (
            <div key={s.key} className="row between g12" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <span className="col"><span className="w7 t-sm">{t(s.title)}</span><span className="t-xs t-mute">{t(s.body)}</span></span>
              {included.has(s.key) ? <span className="chip c-approved">{t('bill.inPlan')}</span>
                : <a className="btn btn-secondary btn-sm" href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(t(s.title))}`} target="_blank" rel="noreferrer">{s.key === 'agents' ? t('bill.add') : t('bill.quote')}</a>}
            </div>
          ))}
        </div>
        <aside className="col g16">
          <div className="card col g8">
            <span className="t-sm t-mute w7">{t('bill.nextCharge')}</span>
            <span className="h2">{money(plan.monthly, plan.currency, lang)}</span>
            <span className="t-sm t-mute">{next ?? '—'}</span>
            {plan.status === 'pending' || plan.status === 'transfer_review'
              ? <Link className="btn btn-primary btn-sm" to="/pay">{t('bill.payNow')}</Link>
              : <button className="btn btn-secondary btn-sm" disabled={!plan.stripeCustomerId} onClick={() => go(() => billingApi.portal(brandId))}>{t('bill.updateMethod')}</button>}
          </div>
          <div className="card col g8"><span className="t-sm w7">{t('bill.braintrust')}</span><span className="t-xs t-mute">{t('bill.braintrustSub')}</span></div>
        </aside>
      </div>
      <section className="card col g8" aria-labelledby="inv-h">
        <h2 className="h3" id="inv-h">{t('bill.invoices')}</h2>
        {invoices.length === 0 && <p className="t-sm t-mute">{t('bill.noInvoices')}</p>}
        {invoices.map((i) => (
          <div key={i.id} className="row between g12 wrap t-sm" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
            <span style={{ minWidth: 110 }}>{i.date?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="grow truncate">{i.concept}</span>
            <span className="w7">{money(i.amount, i.currency, lang)}</span>
            <span className={`chip ${i.status === 'paid' ? 'c-approved' : 'c-lost'}`}>{t(`bill.inv.${i.status}`)}</span>
            {(i.pdfUrl || i.hostedUrl) ? <a href={(i.pdfUrl ?? i.hostedUrl)!} target="_blank" rel="noreferrer" className="w7">PDF</a> : <span className="t-mute">—</span>}
          </div>
        ))}
      </section>
      <div className="card row between g12 wrap">
        <span className="col"><span className="w7 t-sm">{t('bill.details')}</span><span className="t-sm t-mute">{[plan.invoiceDetails?.company, plan.invoiceDetails?.taxId && `NIT ${plan.invoiceDetails.taxId}`, plan.invoiceDetails?.email].filter(Boolean).join(' · ') || '—'}</span></span>
        <Link className="btn btn-ghost btn-sm" to="/pay?edit=details">{t('bill.edit')}</Link>
      </div>
      <div className="row between g12 wrap">
        <span className="t-sm t-mute">{plan.cancelRequestedAt ? t('bill.cancelRequested') : t('bill.cancelNote')}</span>
        {!plan.cancelRequestedAt && <button className="btn btn-ghost btn-sm" onClick={() => setCancel(true)}>{t('bill.requestCancel')}</button>}
      </div>
      {msg && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{msg}</p>}
      {cancel && (
        <ConfirmDialog title={t('bill.cancelTitle')} confirmLabel={t('bill.requestCancel')} danger
          onConfirm={async () => { await billingApi.cancelRequest(brandId); setCancel(false); }} onCancel={() => setCancel(false)}>
          {t('bill.cancelBody')}
        </ConfirmDialog>
      )}
    </div>
  );
}
