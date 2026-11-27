import { useEffect, useState } from 'react';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import type { Plan } from '../../billing/useBilling';
import { BillingDue, type Transfer } from './BillingDue';
import { BillingBrands } from './BillingBrands';
import { PlanDialog } from './PlanDialog';
import { IssuerCard, useIssuerSum } from './IssuerCard';
import type { HostRow } from './SiteHostingAdmin';
import './billing-admin.css';

/** Admin · Billing (design 20; UX audit 27 nov 2026 FA1–FA3): what comes in each month (per currency), what to collect,
 *  one list of brands with plan and hosting, and «who charges» at the end. Title = menu label («Facturación»). */
export function AdminBilling() {
  const { brands } = useBrands();
  const { t } = useI18n();
  const [rows, setRows] = useState<HostRow[] | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [issuerOpen, setIssuerOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const issuer = useIssuerSum();
  useEffect(() => {
    let live = true;
    setFailed(false);
    Promise.all([
      getDocs(collectionGroup(db, 'billing')),
      getDocs(query(collectionGroup(db, 'transfers'), where('status', '==', 'review'))),
    ]).then(([plans, tr]) => {
      if (!live) return;
      setRows(plans.docs.filter((d) => d.id === 'plan').map((d) => ({ brandId: d.ref.parent.parent!.id, ...(d.data() as Plan) })));
      setTransfers(tr.docs.map((d) => ({ id: d.id, brandId: d.ref.parent.parent!.id, reference: d.get('reference'), amount: d.get('amount') ?? null })));
    }).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [tick]);
  const reload = () => setTick((x) => x + 1);
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? id;
  const openIssuer = () => setIssuerOpen(true);

  return (
    <div className="col g24">
      <h1 className="h1">{t('nav.billing')}</h1>
      {issuer.loaded && !issuer.signed && !issuerOpen && (
        <p className="ba-note" role="status"><span>{t('bill.a.sigMissing')}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={openIssuer}>{t('bill.a.complete')}</button></p>
      )}

      {failed && !rows ? (
        <div className="card row between g12 wrap" role="alert" style={{ borderColor: 'var(--danger)', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
          <b>{t('bill.a.loadErr')}</b>
          <button type="button" className="btn btn-secondary btn-sm" onClick={reload}>{t('bill.a.retry')}</button>
        </div>
      ) : !rows ? (
        <div className="col g16" aria-busy="true" aria-label={t('common.loading')}>
          <div className="skel" style={{ height: '7rem' }} /><div className="skel" style={{ height: '2.75rem' }} />
          <div className="skel" style={{ height: '4.25rem' }} /><div className="skel" style={{ height: '4.25rem' }} /><div className="skel" style={{ height: '4.25rem' }} />
        </div>
      ) : (
        <>
          {failed && <p role="alert" className="t-sm" style={{ color: 'var(--danger)' }}>{t('bill.a.loadErr')} <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>{t('bill.a.retry')}</button></p>}
          <BillingDue rows={rows} transfers={transfers} name={name} onOpen={setEditing} reload={reload} />
          <BillingBrands rows={rows} onOpen={setEditing} />
        </>
      )}

      <IssuerCard sum={issuer} open={issuerOpen} onOpen={openIssuer} />
      {editing && rows && <PlanDialog key={editing} brandId={editing} name={name(editing)} row={rows.find((r) => r.brandId === editing)} onClose={() => setEditing(null)} reload={reload} />}
    </div>
  );
}
