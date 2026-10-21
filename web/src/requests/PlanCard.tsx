import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { BrainStack, brainName } from '../components/BrainStack';
import { savePlan } from './api';
import type { BrandRequest } from './types';

/** The plan gate: Nicolas edits and approves the scope; the client sees it once approved. */
export function PlanCard({ brandId, r, isAdmin }: { brandId: string; r: BrandRequest; isAdmin: boolean }) {
  const { t } = useI18n();
  const defaults = [t('req.scope.researcher'), t(`req.scope.lead.${r.leadBrain}`), t('req.scope.builder')];
  const [scope, setScope] = useState<string[]>(r.plan?.scope?.length ? r.plan.scope : defaults);
  const [firstDelivery, setFirstDelivery] = useState(r.plan?.firstDelivery ?? '');
  const [note, setNote] = useState(r.plan?.note ?? '');
  const [busy, setBusy] = useState(false);
  // A new proposal from the Brain (or after "Ask again") refreshes the editable fields.
  useEffect(() => {
    if (r.plan && !r.plan.approved) { setScope(r.plan.scope?.length ? r.plan.scope : defaults); setFirstDelivery(r.plan.firstDelivery ?? ''); setNote(r.plan.note ?? ''); }
  }, [r.plan?.scope?.join('|'), r.plan?.firstDelivery, r.plan?.note]); // eslint-disable-line react-hooks/exhaustive-deps
  const repropose = async () => { setBusy(true); try { await api(`/v1/admin/brands/${brandId}/brains/plan/${r.id}`, { method: 'POST', body: '{}' }); } finally { setBusy(false); } };

  const approved = !!r.plan?.approved;
  if (!isAdmin && !approved) {
    return (
      <div className="card col g12">
        <BrainStack lead={r.leadBrain} state="working" label={t('req.planPreparing', { brain: brainName(r.leadBrain) })} />
        <p className="t-sm t-mute">{r.approvalLevel === 'nicolas' ? t('req.planWithNicolas') : t('req.planSoon')}</p>
      </div>
    );
  }

  const save = async (approve: boolean) => {
    setBusy(true);
    try { await savePlan(brandId, r.id, { scope: scope.filter((s) => s.trim()), firstDelivery, note, approve }); } finally { setBusy(false); }
  };

  return (
    <div className="card col g20">
      <div className="row between g12 wrap">
        <BrainStack lead={r.leadBrain} state={approved ? 'idle' : 'approval'} label={t('req.planBy', { brain: brainName(r.leadBrain) })} />
        <span className="row g8">
          {r.plan?.proposedBy && !approved && <span className="chip chip-plain">{r.plan.proposedWithAi ? t('brains.proposedAi') : t('brains.proposedBasic')}</span>}
          <span className={`chip ${approved ? 'c-approved' : 'c-approve'}`}>{approved ? t('req.planApproved') : t('req.planToApprove')}</span>
        </span>
      </div>
      {isAdmin && !approved && r.plan?.note && <p className="t-sm" style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--hielo)' }}>{r.plan.note}</p>}
      <div className="col g12">
        <p className="label">{t('req.scope')}</p>
        {scope.map((s, i) => (
          <div key={i} className="rule">
            <span className="ok"><Icon name="check" size={14} /></span>
            {isAdmin && !approved
              ? <input className="input" style={{ height: 38 }} value={s} aria-label={`${t('req.scope')} ${i + 1}`} onChange={(e) => setScope((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
              : <span>{s}</span>}
          </div>
        ))}
        {isAdmin && !approved && <button className="btn btn-ghost btn-sm self-start" onClick={() => setScope((l) => [...l, ''])}>+ {t('req.addScope')}</button>}
        <div className="row g24 wrap t-sm">
          <span><span className="t-mute">{t('req.firstDelivery')}</span>{' '}
            {isAdmin && !approved ? <input className="input inline-block" style={{ height: 34, width: 170 }} type="date" value={firstDelivery} onChange={(e) => setFirstDelivery(e.target.value)} aria-label={t('req.firstDelivery')} /> : <strong>{r.plan?.firstDelivery ?? '—'}</strong>}
          </span>
          <span><span className="t-mute">{t('req.approval')}</span> <strong>{r.approvalLevel === 'nicolas' ? t('req.approvalNicolas') : t('req.approvalClient')}</strong></span>
        </div>
      </div>
      {isAdmin && !approved && (
        <>
          <div className="field"><label htmlFor="note">{t('req.noteForBrains')}</label><input className="input" id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('req.notePh')} /></div>
          <div className="row g12 wrap">
            <button className="btn btn-primary" disabled={busy} onClick={() => save(true)}><Icon name="check" />{t('req.approvePlan')}</button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => save(false)}>{t('req.saveDraft')}</button>
            <button className="btn btn-ghost" disabled={busy} onClick={repropose}>{t('brains.askAgain', { brain: brainName(r.leadBrain) })}</button>
            <span className="t-sm t-mute">{t('req.clientSeesPlan')}</span>
          </div>
        </>
      )}
      {approved && r.plan?.note && <p className="t-sm t-mute">{r.plan.note}</p>}
    </div>
  );
}
