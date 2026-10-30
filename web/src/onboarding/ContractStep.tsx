import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { SignContract } from '../contracts/SignContract';
import { ContractDownload } from '../contracts/ContractDownload';
import type { Contract } from '../contracts/types';

/** Step 1 · Rules of the game: the legal representative signs; everyone else sees where it stands. */
export function ContractStep({ brandId, contractId }: { brandId: string; contractId?: string | null }) {
  const { t } = useI18n();
  const { data, loading } = useBrandDoc(brandId, `contracts/${contractId ?? '-'}`);
  if (loading && contractId) return <div className="card t-mute">{t('common.loading')}</div>;
  const contract = data ? ({ id: contractId, ...data } as Contract) : null;

  if (!contract || contract.status === 'draft') {
    return (
      <div className="stage col g12 rounded-[20px] p-6 sm:p-9">
        <p className="label">{t('ctr.step1')}</p>
        <h1 className="d-lg" style={{ color: '#fff', fontSize: 40, lineHeight: '44px' }}><span className="w9">{t('ctr.rules1')}</span> {t('ctr.rules2')}</h1>
        <p className="t-lg muted">{t('ctr.repSigning')}</p>
      </div>
    );
  }
  if (contract.status === 'sent') return <SignContract brandId={brandId} contract={contract} />;
  return (
    <section className="col g20">
      <div className="stage col g12 rounded-[20px] p-6 sm:p-9">
        <p className="label">{t('ctr.step1')}</p>
        <h1 className="d-lg" style={{ color: '#fff', fontSize: 40, lineHeight: '44px' }}><span className="w9">{t('ctr.youSigned1')}</span> {t('ctr.youSigned2')}</h1>
        <p className="t-lg muted">{contract.status === 'signed' ? t('ctr.bothSigned') : t('ctr.waitingNicolas')}</p>
      </div>
      {contract.status === 'signed' && <ContractDownload brandId={brandId} contract={contract} />}
    </section>
  );
}
