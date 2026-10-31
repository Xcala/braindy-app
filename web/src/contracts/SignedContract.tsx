import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { ContractDownload } from './ContractDownload';
import type { Contract } from './types';

/** In My files: the signed contract, for those who may read it (the signer, billing, admin). Nothing for others. */
export function SignedContract({ brandId, contractId }: { brandId: string; contractId?: string | null }) {
  const { t } = useI18n();
  const { data } = useBrandDoc(brandId, `contracts/${contractId ?? '-'}`);
  if (!contractId || !data || data.status !== 'signed') return null;
  return (
    <section className="col g12" aria-labelledby="signed-contract">
      <h2 className="h3" id="signed-contract">{t('ctr.filesTitle')}</h2>
      <ContractDownload brandId={brandId} contract={{ id: contractId, ...data } as Contract} />
    </section>
  );
}
