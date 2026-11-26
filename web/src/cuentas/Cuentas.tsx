import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { BillingFiles } from './BillingFiles';
import { CuentasList } from './CuentasList';
import { PaidDialog } from './PaidDialog';
import { CuentasAdmin } from './admin/CuentasAdmin';
import { cuentasApi, type Cuenta } from './api';

/** Mi plan › Pagos › Cuentas de cobro. The admin manages them; billing people see the issued ones, upload a payment
 *  proof from the top button (or «Ya pagué» on a row) and download NickMark's documents. Hidden when there is nothing. */
export function Cuentas({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [docs, setDocs] = useState<Cuenta[] | null>(null);
  const [paying, setPaying] = useState(false);
  const admin = profile?.role === 'admin';
  const load = useCallback(() => { if (!admin) cuentasApi.list(brandId).then((r) => setDocs(r.docs)).catch(() => setDocs([])); }, [brandId, admin]);
  useEffect(() => { load(); }, [load]);
  if (admin) return <CuentasAdmin brandId={brandId} />;
  if (docs === null) return null;
  // Oldest first: a proof usually pays the cuenta that has waited longest.
  const open = docs.filter((d) => d.type === 'cuenta_cobro' && ['issued', 'sent', 'overdue'].includes(d.status) && !d.payments.some((p) => p.status === 'pending'))
    .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));
  return (
    <section className="col g16" aria-labelledby="cc-h">
      {docs.length > 0 && (
        <>
          <div className="row between g12 wrap">
            <div className="col g4"><h2 className="h2" id="cc-h">{t('cc.title')}</h2><p className="t-sm t-mute">{t('cc.tagline')}</p></div>
            {open.length > 0 && <button className="btn btn-primary" onClick={() => setPaying(true)}>{t('cc.paid.upload')}</button>}
          </div>
          <CuentasList brandId={brandId} docs={docs} reload={load} />
        </>
      )}
      <BillingFiles brandId={brandId} />
      {paying && open[0] && <PaidDialog brandId={brandId} doc={open[0]} choices={open} onClose={() => { setPaying(false); load(); }} />}
    </section>
  );
}
