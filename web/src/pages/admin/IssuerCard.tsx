import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi } from '../../cuentas/api';
import { IssuerSettings } from '../../cuentas/admin/IssuerSettings';

export type IssuerSum = { loaded: boolean; signed: boolean; last4: string | null };

/** Reads only what the Billing page shows about the issuer: is the Colombian profile signed, and the account's last 4. */
export function useIssuerSum(): IssuerSum {
  const [s, setS] = useState<IssuerSum>({ loaded: false, signed: true, last4: null });
  useEffect(() => {
    cuentasApi.issuers().then((r) => {
      const co = r.issuers.find((x) => x.id === 'nicolas')?.issuer;
      const acc = (co?.bank?.accountNumber ?? '').replace(/\D/g, '');
      setS({ loaded: true, signed: !!co?.hasSignature, last4: acc ? acc.slice(-4) : null });
    }).catch(() => setS({ loaded: true, signed: true, last4: null }));
  }, []);
  return s;
}

/** Admin › Billing · «Who charges» (FA3): a one-line card at the end (signature and masked account); «Edit» opens the
 *  full issuer form (shared with Cuentas), which you change almost never. */
export function IssuerCard({ sum, open, onOpen }: { sum: IssuerSum; open: boolean; onOpen: () => void }) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  // The shared form is its own folded card: open it right away, since «Edit» already asked for it.
  useEffect(() => { if (open) { const d = box.current?.querySelector('details'); if (d) d.open = true; box.current?.scrollIntoView({ block: 'nearest' }); } }, [open]);
  if (open) return <div ref={box} id="issuer"><IssuerSettings /></div>;
  return (
    <div id="issuer" className="card row between g12">
      <span className="col g4" style={{ minWidth: 0 }}>
        <span className="w7">{t('bill.a.issuer')} · {t('bill.a.issuerWhere')}</span>
        {sum.loaded && <span className="t-sm t-mute">{[sum.signed ? t('bill.a.sigOk') : t('bill.a.sigNo'), sum.last4 && t('bill.a.account', { n: sum.last4 })].filter(Boolean).join(' · ')}</span>}
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onOpen}>{t('bill.edit')}</button>
    </div>
  );
}
