import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { BillingFiles } from './BillingFiles';
import { CuentasList } from './CuentasList';
import { PaidDialog } from './PaidDialog';
import { CuentasAdmin } from './admin/CuentasAdmin';
import { cuentasApi, money, monthName, type Cuenta, type Currency } from './api';

/** Mi plan › Pagos › Cuentas de cobro. The admin manages them; billing people see the issued ones, upload a payment
 *  proof from the top button (or «Ya pagué» on a row) and download NickMark's documents. Hidden when there is nothing. */
export function Cuentas({ brandId, onHas }: { brandId: string; onHas?: (has: boolean) => void }) {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const [docs, setDocs] = useState<Cuenta[] | null>(null);
  const [feePct, setFeePct] = useState(0);
  const [paying, setPaying] = useState(false);
  const [params] = useSearchParams();
  const card = params.get('card');
  const admin = profile?.role === 'admin';
  const load = useCallback(() => { if (!admin) cuentasApi.list(brandId).then((r) => { setDocs(r.docs); setFeePct(r.cardFeePct ?? 0); onHas?.(r.docs.length > 0); }).catch(() => setDocs([])); }, [brandId, admin, onHas]);
  useEffect(() => { load(); }, [load]);
  if (admin) return <CuentasAdmin brandId={brandId} onHas={onHas} />;
  if (docs === null) return null;
  // Oldest first: a proof usually pays the cuenta that has waited longest.
  const open = docs.filter((d) => d.type === 'cuenta_cobro' && ['issued', 'sent', 'overdue'].includes(d.status) && !d.payments.some((p) => p.status === 'pending'))
    .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));
  // What is left to pay over every open cuenta (per currency) and the one that has waited longest.
  const owed = docs.filter((d) => d.type === 'cuenta_cobro' && ['issued', 'sent', 'overdue'].includes(d.status))
    .reduce((m, d) => m.set(d.currency ?? 'COP', (m.get(d.currency ?? 'COP') ?? 0) + d.amount - d.paid), new Map<Currency, number>());
  const owedText = [...owed].filter(([, v]) => v > 0).map(([c, v]) => money(v, c)).join(' + ');
  const oldest = docs.filter((d) => d.type === 'cuenta_cobro' && ['issued', 'sent', 'overdue'].includes(d.status)).sort((a, b) => a.billingMonth.localeCompare(b.billingMonth))[0];
  return (
    <section className="col g16" aria-labelledby="cc-h">
      {docs.length > 0 && (
        <>
          <div className="row between g12 wrap">
            <div className="col g4"><h2 className="h2" id="cc-h">{t('cc.title')}</h2><p className="t-sm t-mute">{t('cc.tagline')}</p></div>
            {open.length > 0 && <button className="btn btn-primary" onClick={() => setPaying(true)}>{t('cc.paid.upload')}</button>}
          </div>
          {docs.some((d) => d.type === 'cuenta_cobro') && (
            <div className="cc-sum">
              <div className="col g2"><span className="label">{t('cc.sum.owed')}</span><span className="h3 w7">{owedText || t('cc.sum.none')}</span></div>
              {oldest && <div className="col g2"><span className="label">{t('cc.sum.next')}</span><span className="t-sm"><b>{oldest.number}</b> · {monthName(oldest.billingMonth, lang)}</span><span className="t-xs t-mute">{money(oldest.amount - oldest.paid, oldest.currency)}{oldest.payments.some((p) => p.status === 'pending') ? ` · ${t('cc.pending')}` : ''}</span></div>}
            </div>
          )}
          {card === 'paid' && <p className="card card-tight t-sm" role="status">{t('cc.pay.thanks')}</p>}
          {card === 'canceled' && <p className="t-sm t-mute" role="status">{t('cc.pay.canceled')}</p>}
          <CuentasList brandId={brandId} docs={docs} reload={load} feePct={feePct} />
        </>
      )}
      <BillingFiles brandId={brandId} />
      {paying && open[0] && <PaidDialog brandId={brandId} doc={open[0]} choices={open} onClose={() => { setPaying(false); load(); }} />}
    </section>
  );
}
