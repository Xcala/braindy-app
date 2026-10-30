import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { contractsApi } from './api';
import type { Contract } from './types';

/** The signed contract PDF (both signatures + certificate). For admin, the signer and people who see billing. */
export function ContractDownload({ brandId, contract, compact }: { brandId: string; contract: Contract; compact?: boolean }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const open = async () => {
    setBusy(true); setError(false);
    try { window.open((await contractsApi.pdfUrl(brandId, contract.id)).url, '_blank', 'noopener'); }
    catch { setError(true); } finally { setBusy(false); }
  };
  const when = contract.signatures?.contractor?.signedAt;
  return (
    <div className="card row between g16 wrap" style={{ padding: compact ? 16 : 22 }}>
      <div className="row g12 min-w-0">
        <span className="ficon th-pdf"><Icon name="file" /></span>
        <div className="col min-w-0">
          <span className="w7 truncate">{contract.pdf?.fileName ?? t('ctr.pdfTitle')}</span>
          <span className="t-xs t-mute">{when ? t('ctr.signedOn', { date: new Date(when).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long' }) }) : ''} · SHA-256 {contract.pdf?.sha256.slice(0, 12)}…</span>
        </div>
      </div>
      <div className="row g8">
        {error && <span className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('ctr.err.error')}</span>}
        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={open}><Icon name="download" />{t('ctr.download')}</button>
      </div>
    </div>
  );
}
