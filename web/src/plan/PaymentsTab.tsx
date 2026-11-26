import { useState } from 'react';
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

/** Mi plan › Pagos: every charge of the brand in one place. Website hosting (its action lives in Sitio), the design plan
 *  with services, next charge, card, invoices, invoice details and cancellation (it used to be Settings › Billing). */
export function PaymentsTab({ brand }: { brand: Brand }) {
  const { t } = useI18n();
  const { plan, invoices } = useBilling(brand.id);
  const { profile } = useAuth();
  const [, setParams] = useSearchParams();
  const [hasCuentas, setHasCuentas] = useState(false);
  if (plan === undefined) return <p className="t-mute">{t('common.loading')}…</p>;
  const design = !!plan && !!(plan.monthly || plan.project);
  return (
    <div className="col g24">
      <Cuentas brandId={brand.id} onHas={setHasCuentas} />
      <HostingStatus plan={plan} compact onAct={() => { setParams({ tab: 'site' }, { replace: true }); window.scrollTo({ top: 0 }); }} />
      {design ? <BillingCard brandId={brand.id} />
        // A brand billed by cuentas de cobro with no design plan and no invoices does not need the empty plan offer.
        : hasCuentas && !invoices?.length ? (profile?.role === 'admin' ? <details className="card"><summary className="w7">{t('cc.s.otherPlans')}</summary><div className="col g24" style={{ marginTop: '0.75rem' }}><Subscription current={brand} part="design" /></div></details> : null)
        : <><Subscription current={brand} part="design" /><Invoices invoices={invoices} /></>}
    </div>
  );
}
