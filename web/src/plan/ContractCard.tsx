import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { SignContract } from '../contracts/SignContract';
import { ContractDownload } from '../contracts/ContractDownload';
import type { Contract } from '../contracts/types';

const TONE = {
  wait: { background: '#FFFBF0', borderColor: '#F5D98A' },
  ok: { background: '#E6F7F0', borderColor: '#A7E3C8' },
};

/** The contract that makes the plan binding, where it stands: in preparation, to sign (the signer signs right here),
 *  or signed with the sealed PDF (NickMark signs when sending, so the client's signature closes it). Admin gets a shortcut to the contract panel. */
export function ContractCard({ brandId, contract }: { brandId: string; contract: Contract | null }) {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const admin = profile?.role === 'admin';
  const isSigner = !!contract && (user?.email ?? '').toLowerCase() === contract.signer.email.toLowerCase();
  const panel = admin && <Link to="/admin/onboarding" className="btn btn-secondary btn-sm">{t('plan.c.panel')}</Link>;
  const head = (title: string, body: string, style?: React.CSSProperties) => (
    <div className="card card-tight row g16" style={{ justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', ...style }}>
      <div className="col g4" style={{ minWidth: 0, flex: '1 1 320px' }}>
        <span className="label">{t('plan.c.label')}</span>
        <span className="w9" style={{ fontSize: '1.25rem', lineHeight: '26px' }}>{title}</span>
        <span className="t-sm t-mute">{body}</span>
      </div>
      {panel}
    </div>
  );

  let body;
  if (!contract || contract.status === 'draft') body = head(t('plan.c.prep'), admin ? t('plan.c.prepAdmin') : t('plan.c.prepBody'));
  else if (contract.status === 'sent') {
    body = isSigner && !admin
      ? <div className="col g12">{head(t('plan.c.toSign'), t('plan.c.toSignBody'), TONE.wait)}<SignContract brandId={brandId} contract={contract} /></div>
      : head(t('plan.c.toSign'), t('plan.c.waitingSigner', { name: contract.signer.name || contract.signer.email }), TONE.wait);
  } else body = <div className="col g12">{head(t('plan.c.signed'), t(contract.source === 'external' ? 'ctr.bothSignedOutside' : 'ctr.bothSigned'), TONE.ok)}<ContractDownload brandId={brandId} contract={contract} compact /></div>;

  return <section className="col g12" aria-label={t('plan.c.label')}>{body}</section>;
}
