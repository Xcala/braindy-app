import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { contractsApi } from './api';
import type { Contract } from './types';

/** The otrosíes of a contract, newest first: what each one does, where its signatures stand, and its PDF. */
export function Amendments({ brandId, contract }: { brandId: string; contract: Contract }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const list = [...(contract.amendments ?? [])].sort((a, b) => b.sentOn.localeCompare(a.sentOn));
  if (!list.length) return null;
  const day = (ymd: string) => new Date(`${ymd}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long' });
  const open = async (aid: string) => {
    setBusy(aid);
    try { window.open((await contractsApi.amendmentUrl(brandId, contract.id, aid)).url, '_blank', 'noopener'); } catch { /* the button stays */ } finally { setBusy(null); }
  };
  return (
    <div className="col g8">
      <span className="label">{t('ctr.am.label')}</span>
      {list.map((a) => (
        <div key={a.id} className="card row between g16 wrap" style={{ padding: 16 }}>
          <div className="row g12 min-w-0" style={{ flex: '1 1 18rem' }}>
            <span className="ficon th-pdf"><Icon name="file" /></span>
            <div className="col g2 min-w-0">
              <span className="w7">{a.title}</span>
              {a.extendsTo && <span className="t-sm">{t('ctr.am.extends', { date: day(a.extendsTo) })}</span>}
              <span className="t-xs t-mute">{a.status === 'signed' && a.signedOn ? t('ctr.am.signed', { date: day(a.signedOn) }) : t('ctr.am.sent')}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" disabled={busy === a.id} onClick={() => open(a.id)}><Icon name="download" />{t('ctr.download')}</button>
        </div>
      ))}
    </div>
  );
}
