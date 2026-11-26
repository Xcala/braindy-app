import { useEffect, useRef, useState } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { Button } from '../components/Button';
import { ProposalPick } from './ProposalPick';
import { proposalTitle, type BrandProposal } from './ProposalCard';
import { AdminPlan } from './AdminPlan';
import type { BrandPlan } from './types';

/** Admin only · «Edit plan»: the proposal and the plan form in a side panel (2026-11-24), so Mi plan shows Nick the same page the client sees. */
export function PlanEditor({ brandId, brandName, plan, onClose }: { brandId: string; brandName: string; plan: BrandPlan | null; onClose: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('.modal-x')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const body = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = body; prev?.focus(); };
  }, [onClose]);

  return (
    <div className="scrim fixed inset-0 z-[85] flex justify-end" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="plan-editor" role="dialog" aria-modal="true" aria-labelledby="pe-title">
        <div className="row between g12" style={{ alignItems: 'flex-start' }}>
          <div className="col g4">
            <p className="label" style={{ margin: 0 }}>{brandName}</p>
            <h2 id="pe-title" className="h2" style={{ margin: 0 }}>{t('pe.title')}</h2>
            <p className="t-sm t-mute" style={{ margin: 0 }}>{t('pe.sub')}</p>
          </div>
          <button type="button" className="modal-x" onClick={onClose} aria-label={t('lb.close')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <ProposalPart brandId={brandId} brandName={brandName} />
        <hr className="plan-editor-rule" />
        <AdminPlan key={brandId} brandId={brandId} plan={plan} flat />
      </div>
    </div>
  );
}

/** The proposal: what is there now with Change / Remove (remove undoes from the toast), or the picker when there is none. */
function ProposalPart({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const { data, loading } = useBrandDoc(brandId, 'context/proposal');
  const p = data as (BrandProposal & Record<string, unknown>) | null;
  const [editing, setEditing] = useState(false);
  if (loading) return null;
  if (!p || editing) return <ProposalPick bare brandId={brandId} onDone={() => setEditing(false)} onCancel={p ? () => setEditing(false) : undefined} />;

  const remove = async () => {
    const ref = doc(db, 'brands', brandId, 'context', 'proposal');
    const before = { ...p };
    await deleteDoc(ref);
    toast({ text: t('pp.removed'), undo: () => setDoc(ref, before) });
  };
  return (
    <section className="col g12" aria-labelledby="pe-proposal">
      <h3 id="pe-proposal" className="h3" style={{ margin: 0 }}>{t('pe.proposal')}</h3>
      <div className="card card-tight row between g12 wrap" style={{ alignItems: 'center' }}>
        <div className="col g4" style={{ minWidth: 0, flex: '1 1 12rem' }}>
          <span className="label">{t(`pp.kind.${p.kind}`)}</span>
          <span className="w7" style={{ overflowWrap: 'anywhere' }}>{proposalTitle(p, t('pp.for', { brand: brandName }))}</span>
        </div>
        <div className="row g8">
          <Button size="sm" onClick={() => setEditing(true)}>{t('pp.change')}</Button>
          <Button size="sm" variant="ghost" onClick={remove}>{t('pp.remove')}</Button>
        </div>
      </div>
    </section>
  );
}
