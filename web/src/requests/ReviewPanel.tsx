import { useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { BrainStack, brainName } from '../components/BrainStack';
import { decide } from './api';
import type { Annotation, BrandRequest, RequestComment, Version } from './types';
import { useToast } from '../components/Toaster';

/** Right panel of the review screen: who made it and why, the decision, and the comments. */
export function ReviewPanel({ brandId, r, v, comments, canApprove, pendingMark, clearMark }: {
  brandId: string; r: BrandRequest; v?: Version; comments: RequestComment[]; canApprove: boolean;
  pendingMark: Annotation | null; clearMark: () => void;
}) {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<'open' | 'resolved'>('open');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isLatest = v && r.latestVersion === v.id;
  const pending = v?.published && v.approval?.state === 'pending';
  const shown = comments.filter((c) => (filter === 'resolved' ? c.resolved : !c.resolved));
  const pinNumber = (c: RequestComment) => comments.filter((x) => x.annotation && x.annotation.versionId === c.annotation?.versionId).indexOf(c) + 1;
  const authorName = (c: RequestComment) => (c.author === user?.uid ? t('req.you') : c.kind === 'changes_requested' ? t('req.changesRequested') : t('req.team'));

  async function send() {
    if (!text.trim() || !user) return;
    await addDoc(collection(db, 'brands', brandId, 'requests', r.id, 'comments'), {
      author: user.uid, text: text.trim(), createdAt: serverTimestamp(),
      ...(pendingMark ? { annotation: pendingMark, versionId: pendingMark.versionId } : v ? { versionId: v.id } : {}),
    });
    setText(''); clearMark();
  }
  async function decision(state: 'approved' | 'changes_requested') {
    if (!v) return;
    setError('');
    const openOnVersion = comments.some((c) => !c.resolved && c.versionId === v.id);
    if (state === 'changes_requested' && !text.trim() && !openOnVersion) { setError(t('req.changesNeedComment')); return; }
    setBusy(true);
    try { await decide(brandId, r.id, v.id, state, state === 'changes_requested' ? text.trim() || t('req.seeComments') : ''); setText(''); clearMark(); }
    catch { setError(t('req.decisionError')); } finally { setBusy(false); }
  }
  const toast = useToast();
  const setResolved = (c: RequestComment, resolved: boolean) => user && updateDoc(doc(db, 'brands', brandId, 'requests', r.id, 'comments', c.id), { resolved, resolvedBy: user.uid, resolvedAt: serverTimestamp() });
  const resolve = async (c: RequestComment) => {
    await setResolved(c, !c.resolved);
    toast({ text: t(c.resolved ? 'toast.reopened' : 'toast.resolved'), undo: () => setResolved(c, !!c.resolved) });
  };

  return (
    <aside className="col min-h-0" style={{ borderLeft: '1px solid var(--line)' }}>
      {v && (
        <div className="col g12" style={{ padding: 20, borderBottom: '1px solid var(--line)' }}>
          <BrainStack lead={v.brain ?? r.leadBrain} label={r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(v.brain ?? r.leadBrain) })} />
          {v.notes && <p className="t-sm t-mute">{v.notes}</p>}
          {v.reason && <div className="col" style={{ gap: 6, padding: '14px 16px', borderRadius: 14, background: 'var(--hielo)' }}><span className="t-sm w7">{t('req.whyItWorks')}</span><span className="t-sm">{v.reason}</span><span className="t-xs t-mute">{t('req.everyPieceReason')}</span></div>}
          {v.approval?.state === 'approved' && <span className="chip c-approved self-start">{t('req.approvedChip', { n: v.n })}</span>}
          {v.approval?.state === 'changes_requested' && <span className="chip c-approve self-start">{t('req.changesChip')}</span>}
          {canApprove && pending && isLatest && (
            <div className="row g8" data-tour="review-decide">
              <button className="btn btn-primary grow" disabled={busy} onClick={() => decision('approved')}><Icon name="check" />{t('req.approveV', { n: v.n })}</button>
              <button className="btn btn-secondary grow" disabled={busy} onClick={() => decision('changes_requested')}>{t('req.requestChanges')}</button>
            </div>
          )}
          {!canApprove && pending && isLatest && profile?.role !== 'admin' && <p className="t-xs t-mute">{t('req.cannotApprove')}</p>}
          {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
        </div>
      )}
      <div className="col g16 min-h-0 flex-1" style={{ padding: 20 }} data-tour="review-comments">
        <div className="row between"><p className="label">{t('req.comments')}</p>
          <div className="seg" role="group" aria-label={t('req.filterComments')}>
            <button className={filter === 'open' ? 'is-on' : ''} onClick={() => setFilter('open')}>{t('req.open')}</button>
            <button className={filter === 'resolved' ? 'is-on' : ''} onClick={() => setFilter('resolved')}>{t('req.resolved')}</button>
          </div>
        </div>
        <div className="col g16 overflow-y-auto" style={{ maxHeight: 360 }}>
          {shown.length === 0 && <p className="t-sm t-mute">{filter === 'open' ? t('req.noOpenComments') : t('req.noResolved')}</p>}
          {shown.map((c) => (
            <div key={c.id} className="row g12" style={{ alignItems: 'flex-start' }}>
              <span className="flex flex-none items-center justify-center" style={{ width: 28, height: 28, borderRadius: '50%', background: c.annotation ? 'var(--azul)' : 'var(--hielo)', color: c.annotation ? '#fff' : 'var(--azul-press)', font: '800 12px/1 var(--f-text)' }}>{c.annotation ? pinNumber(c) : '·'}</span>
              <div className="col g4 grow">
                <span className="t-sm"><strong>{authorName(c)}</strong> <span className="t-mute">· {c.createdAt?.toDate().toLocaleDateString()}</span></span>
                <p className="t-sm" style={{ whiteSpace: 'pre-line' }}>{c.text}</p>
                {(c.author === user?.uid || canApprove) && <button className="t-xs w7 self-start" style={{ background: 'none', border: 0, color: 'var(--azul)', cursor: 'pointer', padding: 0 }} onClick={() => resolve(c)}>{c.resolved ? t('req.reopen') : t('req.resolve')}</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="col g8" style={{ marginTop: 'auto' }}>
          <label htmlFor="cmt" className="t-sm w7">{pendingMark ? t('req.commentOnMark') : t('req.addComment')}</label>
          <div className="row g8">
            <input className="input" id="cmt" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={t('req.commentPh')} />
            <button className="btn btn-primary btn-icon" aria-label={t('req.sendComment')} onClick={send} disabled={!text.trim()}><Icon name="arrowLeft" className="rotate-180" /></button>
          </div>
          {pendingMark && <button className="t-xs self-start" style={{ background: 'none', border: 0, color: 'var(--graphite)', cursor: 'pointer', padding: 0 }} onClick={clearMark}>{t('req.cancelMark')}</button>}
          <span className="t-xs t-mute">{t('req.changesHint')}</span>
        </div>
      </div>
    </aside>
  );
}
