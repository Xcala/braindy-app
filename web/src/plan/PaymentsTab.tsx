import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import type { Brand } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useBilling } from '../billing/useBilling';
import { BillingCard } from '../settings/BillingCard';
import { Invoices } from '../settings/Invoices';
import { HostingStatus } from './HostingStatus';
import { Subscription } from './Subscription';
import { Cuentas } from '../cuentas/Cuentas';
import { CARD_PLAN_ID } from '../cuentas/admin/CuentasAdmin';
import '../cuentas/cuentas.css';
import { markCuentas } from '../cuentas/hasCuentas';

/** Mi plan › Pagos: every charge of the brand in one place. Website hosting (its action lives in Sitio), the design plan
 *  with services, next charge, card, invoices, invoice details and cancellation (it used to be Settings › Billing). */
export function PaymentsTab({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const { plan, invoices } = useBilling(brand.id);
  const { profile } = useAuth();
  const [, setParams] = useSearchParams();
  const [hasCuentas, setHasCuentas] = useState(false);
  // Stable: Cuentas reloads when it changes.
  const onHas = useCallback((h: boolean) => { setHasCuentas(h); markCuentas(brand.id, h); }, [brand.id]);
  if (plan === undefined) return <p className="t-mute">{t('common.loading')}…</p>;
  const design = !!plan && !!(plan.monthly || plan.project);
  const admin = profile?.role === 'admin';
  return (
    <div className="col g24">
      <Cuentas brandId={brand.id} onHas={onHas} />
      <HostingStatus plan={plan} compact onAct={() => { setParams({ tab: 'site' }, { replace: true }); window.scrollTo({ top: 0 }); }} />
      {design ? <BillingCard brandId={brand.id} />
        // NickMark without a card plan or invoices: the plan offer folded (the empty «Aún no hay cobros» card opens it),
        // never the client's «no tienes plan» and «no hay facturas» in a row.
        : admin && !invoices?.length ? <details className="cc-fold" id={CARD_PLAN_ID}><summary>{t('pg.e.card')}</summary><div className="col g24"><Subscription current={brand} part="design" /></div></details>
        // A brand billed by cuentas de cobro with no design plan and no invoices does not need the empty plan offer.
        : hasCuentas && !invoices?.length ? null
        : <><Subscription current={brand} part="design" /><Invoices invoices={invoices} /></>}
    </div>
  );
}
