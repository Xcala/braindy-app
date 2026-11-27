import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { CuentasClient } from './CuentasClient';
import { CuentasAdmin } from './admin/CuentasAdmin';
import { cuentasApi, type ClientProject, type Cuenta } from './api';

/** Mi plan › Pagos › Cuentas de cobro. The admin manages them; billing people see their project, what to pay now and
 *  what comes next (CuentasClient). Hidden for the client when there is nothing sent yet. */
export function Cuentas({ brandId, onHas }: { brandId: string; onHas?: (has: boolean) => void }) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [data, setData] = useState<{ docs: Cuenta[]; projects: ClientProject[]; feePct: number } | null>(null);
  const [params] = useSearchParams();
  const card = params.get('card');
  const admin = profile?.role === 'admin';
  const load = useCallback(() => {
    if (admin) return;
    cuentasApi.list(brandId)
      .then((r) => { setData({ docs: r.docs, projects: r.projects ?? [], feePct: r.cardFeePct ?? 0 }); onHas?.(r.docs.length > 0); })
      .catch(() => setData({ docs: [], projects: [], feePct: 0 }));
  }, [brandId, admin, onHas]);
  useEffect(() => { load(); }, [load]);
  if (admin) return <CuentasAdmin brandId={brandId} onHas={onHas} />;
  if (!data || !data.docs.length) return null;
  return (
    <section className="col g16" aria-labelledby="cc-h">
      <h2 className="h2" id="cc-h">{t('cc.title')}</h2>
      {card === 'paid' && <p className="card card-tight t-sm" role="status">{t('cc.pay.thanks')}</p>}
      {card === 'canceled' && <p className="t-sm t-mute" role="status">{t('cc.pay.canceled')}</p>}
      <CuentasClient brandId={brandId} docs={data.docs} projects={data.projects} feePct={data.feePct} reload={load} />
    </section>
  );
}
