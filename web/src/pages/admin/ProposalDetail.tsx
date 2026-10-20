import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useBrands } from '../../brands/BrandProvider';
import { useProposal } from '../../proposals/useProposals';
import { ProposalForm } from '../../proposals/ProposalForm';
import { ProposalFiles } from '../../proposals/ProposalFiles';
import { SendPanel } from '../../proposals/SendPanel';
import { Tracking } from '../../proposals/Tracking';
import { convertToBrand } from '../../proposals/api';
import { STATUS_CHIP } from '../../proposals/types';

export function ProposalDetail() {
  const { id = '' } = useParams();
  const p = useProposal(id);
  const { t } = useI18n();
  const { select } = useBrands();
  const [dialog, setDialog] = useState<'lost' | 'won' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (p === undefined) return <p className="t-mute">{t('common.loading')}…</p>;
  if (p === null) return <p className="t-mute">{t('proposals.notFound')}</p>;

  async function markLost() {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'proposals', id), { status: 'lost', lostReason: reason, lastActivity: { type: 'lost', at: serverTimestamp() } });
      setDialog(null);
    } finally { setBusy(false); }
  }
  async function convert() {
    setBusy(true);
    try {
      const { brandId } = await convertToBrand(id);
      select(brandId);
      setDialog(null);
    } finally { setBusy(false); }
  }

  return (
    <div className="col" style={{ gap: 28 }}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/admin/proposals">{t('proposals.title')}</Link><Icon name="chevronRight" size={14} /><span className="cur">{p.prospect?.company || p.title}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="col g12">
          <div className="row g12"><span className={`chip ${STATUS_CHIP[p.status]}`}>{t(`proposals.status.${p.status}`)}</span>
            <span className="t-sm t-mute">{p.lang === 'es' ? 'Español' : 'English'}</span></div>
          <h1 className="h1">{p.prospect?.company && <>{p.prospect.company} </>}<span className={p.prospect?.company ? 'w3' : 'w9'}>{p.title}</span></h1>
          {p.acceptance && <p className="t-sm" style={{ color: 'var(--success)' }}>{t('proposals.acceptedBy', { name: p.acceptance.name })}{p.acceptance.role ? ` · ${p.acceptance.role}` : ''}</p>}
          {p.status === 'lost' && p.lostReason && <p className="t-sm t-mute">{t('proposals.reason')}: {p.lostReason}</p>}
        </div>
        <div className="row g12 wrap flex-none">
          {p.convertedBrandId ? (
            <Link className="btn btn-secondary" to="/brand" onClick={() => select(p.convertedBrandId!)}>{t('proposals.openClient')}</Link>
          ) : (
            <>
              {p.status !== 'lost' && <button className="btn btn-secondary" onClick={() => setDialog('lost')}>{t('proposals.markLost')}</button>}
              <button className="btn btn-primary" onClick={() => setDialog('won')}><Icon name="check" />{t('proposals.wonCreate')}</button>
            </>
          )}
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="col g24">
          <ProposalForm key={p.id} p={p} />
          <ProposalFiles id={p.id} />
          <Tracking id={p.id} />
        </div>
        <SendPanel key={`${p.id}-${p.prospect?.phone ?? ''}`} p={p} />
      </div>

      {dialog === 'lost' && (
        <ConfirmDialog title={t('proposals.markLostTitle')} confirmLabel={t('proposals.markLost')} danger busy={busy} onConfirm={markLost} onCancel={() => setDialog(null)}>
          <div className="field" style={{ marginTop: 8 }}>
            <label htmlFor="reason">{t('proposals.reason')}</label>
            <input id="reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('proposals.reasonPh')} />
          </div>
        </ConfirmDialog>
      )}
      {dialog === 'won' && (
        <ConfirmDialog title={t('proposals.wonTitle', { name: p.prospect?.company || p.prospect?.name || p.title })} confirmLabel={t('proposals.createClient')} busy={busy} onConfirm={convert} onCancel={() => setDialog(null)}>
          {t('proposals.wonBody')}
        </ConfirmDialog>
      )}
    </div>
  );
}
