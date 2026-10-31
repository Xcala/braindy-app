import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ContractView } from '../contract/ContractView';
import { AdminContract } from '../contract/AdminContract';
import { contractApi, useContract } from '../contract/useContract';

/** Mi plan: what the client contracted (plans or packs, the work plan with its deliverables, hosting and maintenance). */
export function MyPlan() {
  const { current } = useBrands();
  const { profile } = useAuth();
  const { t } = useI18n();
  const contract = useContract(current?.id);
  const admin = profile?.role === 'admin';
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;
  if (contract === undefined) return <p className="t-mute">{t('common.loading')}…</p>;
  const id = current.id;
  return (
    <div className="col g32">
      {contract ? (
        <ContractView c={contract} brandName={current.name}
          onToggle={admin ? (s, r, d) => { void contractApi.rowDone(id, s, r, d); } : undefined}
          onPackStatus={admin ? (i, st) => { void contractApi.packStatus(id, i, st); } : undefined} />
      ) : (
        <div className="col g8"><p className="label">{current.name}</p><h1 className="h1"><span className="w9">{t('plan.title')}.</span></h1><div className="card t-mute">{t('plan.empty')}</div></div>
      )}
      {contract && <p className="t-sm t-mute" style={{ margin: 0 }}>{t('plan.payments')} <Link to="/settings?tab=billing" className="w7">{t('set.tab.billing')}</Link></p>}
      {admin && <AdminContract key={id} brandId={id} contract={contract} />}
    </div>
  );
}
