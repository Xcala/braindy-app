import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { CuentasList } from './CuentasList';
import { CuentasAdmin } from './admin/CuentasAdmin';
import { cuentasApi, type Cuenta } from './api';

/** Mi plan › Pagos › Cuentas de cobro. The admin manages them; billing people see the issued ones (hidden when there are none). */
export function Cuentas({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [docs, setDocs] = useState<Cuenta[] | null>(null);
  const admin = profile?.role === 'admin';
  const load = useCallback(() => { if (!admin) cuentasApi.list(brandId).then((r) => setDocs(r.docs)).catch(() => setDocs([])); }, [brandId, admin]);
  useEffect(() => { load(); }, [load]);
  if (admin) return <CuentasAdmin brandId={brandId} />;
  if (!docs?.length) return null;
  return (
    <section className="col g12" aria-labelledby="cc-h">
      <div className="col g4"><h2 className="h2" id="cc-h">{t('cc.title')}</h2><p className="t-sm t-mute">{t('cc.tagline')}</p></div>
      <CuentasList brandId={brandId} docs={docs} reload={load} />
    </section>
  );
}
