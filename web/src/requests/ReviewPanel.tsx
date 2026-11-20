import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { brainName } from '../components/BrainStack';
import { ObjectionHint, useObjectionMatch } from '../criterio/LessonCards';
import { logObjection } from '../criterio/useCriterio';
import { decide, markDone } from './api';
import { markFile } from './useFileUrl';
import { clock } from './VideoMarks';
import { AdaptDialog } from './AdaptDialog';
import { VersionNotes } from './VersionNotes';
import { Scan } from '../components/Scan';
import { CommentEdit } from '../components/CommentEdit';
import type { Annotation, BrandRequest, RequestComment, Version } from './types';
import { useToast } from '../components/Toaster';
import { LearnedMoment } from '../brain/BrainLearned';
import { AskedBox } from './AskedBox';
import { RateDelivery } from './RateDelivery';

/** Right panel of the review screen: who made it and why, the decision, and the comments. */
export function ReviewPanel({ brandId, r, v, comments, addenda = [], canApprove, pendingMark, clearMark, onShowFile, onSeek }: {
  brandId: string; r: BrandRequest; v?: Version; comments: RequestComment[]; addenda?: RequestComment[]; canApprove: boolean;
  pendingMark: Annotation | null; clearMark: () => void; onShowFile: (i: number) => void; onSeek: (fileIndex: number, t: number) => void;
}) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const objection = useObjectionMatch(text);
  const sentAnyway = () => { if (objection) logObjection(brandId, objection.id, 'sent'); };
  const [filter, setFilter] = useState<'open' | 'resolved'>('open');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [adapting, setAdapting] = useState(false);
  const [learned, setLearned] = useState<{ kind: 'approved' | 'changed'; text: string } | null>(null);
  const cRef = (c: RequestComment) => doc(db, 'brands', brandId, 'requests', r.id, 'comments', c.id);

  const isLatest = v && r.latestVersion === v.id;
  const pending = v?.published && v.approval?.state === 'pending' && !r.doneOutside;
  const shown = comments.filter((c) => (filter === 'resolved' ? c.resolved : !c.resolved));
  // Numbered per file, as the pins on the piece are.
  const pinNumber = (c: RequestComment) => comments.filter((x) => x.annotation && x.annotation.versionId === c.annotation?.versionId && markFile(x.annotation) === markFile(c.annotation)).indexOf(c) + 1;
  const markedOn = (c: RequestComment) => (c.annotation && (v?.files?.length ?? 0) > 1 ? v?.files?.[markFile(c.annotation)] : undefined);
  const authorName = (c: RequestComment) => (c.author === user?.uid ? t('req.you') : c.kind === 'changes_requested' ? t('req.changesRequested') : t('req.team'));

  async function send() {
    if (!text.trim() || !user) return;
    await addDoc(collection(db, 'brands', brandId, 'requests', r.id, 'comments'), {
      author: user.uid, text: text.trim(), createdAt: serverTimestamp(),
      ...(pendingMark ? { annotation: pendingMark, versionId: pendingMark.versionId } : v ? { versionId: v.id } : {}),
    });
    sentAnyway(); setText(''); clearMark();
  }
  async function decision(state: 'approved' | 'changes_requested') {
    if (!v) return;
    setError('');
    const openOnVersion = comments.some((c) => !c.resolved && c.versionId === v.id);
    if (state === 'changes_requested' && !text.trim() && !openOnVersion) { setError(t('req.changesNeedComment')); return; }
    setBusy(true);
    const note = state === 'changes_requested' ? text.trim() || t('req.seeComments') : '';
    try {
      await decide(brandId, r.id, v.id, state, note);
      if (state === 'changes_requested') sentAnyway();
      // The same thing the Brand Brain records on the server (brains/learn.ts): what was liked, or what to change.
      setLearned(state === 'approved' ? { kind: 'approved', text: v.reason || v.notes || '' } : { kind: 'changed', text: note });
      setText(''); clearMark();
    }
    catch { setError(t('req.decisionError')); } finally { setBusy(false); }
  }
  const toast = useToast();
  async function done(undo = false) {
    setBusy(true); setError('');
    try { await markDone(brandId, r.id, undo); if (!undo) toast({ text: t('req.doneToast'), undo: () => { void markDone(brandId, r.id, true); } }); }
    catch { setError(t('req.decisionError')); } finally { setBusy(false); }
  }
  const setResolved = (c: RequestComment, resolved: boolean) => user && updateDoc(doc(db, 'brands', brandId, 'requests', r.id, 'comments', c.id), { resolved, resolvedBy: user.uid, resolvedAt: serverTimestamp() });
  const resolve = async (c: RequestComment) => {
    await setResolved(c, !c.resolved);
    toast({ text: t(c.resolved ? 'toast.reopened' : 'toast.resolved'), undo: () => setResolved(c, !!c.resolved) });
  };

  return (
    <aside className="col min-h-0" style={{ borderLeft: '1px solid var(--line)' }}>
      {v && (
        <div className="col g12" style={{ padding: '1.25rem', borderBottom: '1px solid var(--line)' }}>
          <span className="row g8">
            <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-8 w-8 flex-none rounded-full object-cover" />
            {(v.brain ?? r.leadBrain) && <img src={`/brand/brains/${v.brain ?? r.leadBrain}.png`} alt="" className="h-8 w-8 flex-none rounded-full" style={{ marginLeft: '-0.75rem', boxShadow: '0 0 0 2px #fff', background: 'var(--niebla)' }} />}
            <span className="t-sm">{r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(v.brain ?? r.leadBrain) })}</span>
          </span>
          {v.notes && <VersionNotes text={v.notes} />}
          {v.reason && <div className="col" style={{ gap: '0.375rem', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'var(--hielo)' }}><span className="t-sm w7">{t('req.whyItWorks')}</span><Scan text={v.reason} points tone="ink" /><span className="t-xs t-mute">{t('req.everyPieceReason')}</span></div>}
          {v.approval?.state === 'approved' && (
            <div className="row g8 wrap">
              <span className="chip c-approved">{t('req.approvedChip', { n: v.n })}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdapting(true)}><Icon name="plus" size={16} />{t('ad.btn')}</button>
            </div>
          )}
          {v.approval?.state === 'approved' && profile?.role !== 'admin' && <RateDelivery brandId={brandId} requestId={r.id} versionId={v.id} comments={comments} />}
          {adapting && <AdaptDialog brandId={brandId} r={r} v={v} onClose={() => setAdapting(false)} />}
          {v.approval?.state === 'changes_requested' && <span className="chip c-approve self-start">{t('req.changesChip')}</span>}
          {canApprove && pending && isLatest && <AskedBox r={r} addenda={addenda} />}
          {canApprove && pending && isLatest && (
            <div className="col g8" data-tour="review-decide">
              <button className="btn btn-primary w-full" disabled={busy} onClick={() => decision('approved')}><Icon name="check" />{t('req.approveV', { n: v.n })}</button>
              <button className="btn btn-secondary w-full" disabled={busy} onClick={() => decision('changes_requested')}>{t('req.requestChanges')}</button>
            </div>
          )}
          {canApprove && pending && isLatest && (
            <button type="button" className="btn btn-ghost btn-sm self-start" disabled={busy} title={t('req.doneHint')} onClick={() => done()}><Icon name="archive" size={16} />{t('req.done')}</button>
          )}
          {r.doneOutside && (
            <div className="row g8 wrap">
              <span className="chip c-approved">{t('req.doneChip')}</span>
              {canApprove && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => done(true)}>{t('req.doneUndo')}</button>}
            </div>
          )}
          {!canApprove && pending && isLatest && profile?.role !== 'admin' && <p className="t-xs t-mute">{t('req.cannotApprove')}</p>}
          {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
          {learned && <LearnedMoment kind={learned.kind} text={learned.text} />}
        </div>
      )}
      <div className="col g16 min-h-0 flex-1" style={{ padding: '1.25rem' }} data-tour="review-comments">
        <div className="row between"><p className="label">{t('req.comments')}</p>
          <div className="seg" role="group" aria-label={t('req.filterComments')}>
            <button className={filter === 'open' ? 'is-on' : ''} onClick={() => setFilter('open')}>{t('req.open')}</button>
            <button className={filter === 'resolved' ? 'is-on' : ''} onClick={() => setFilter('resolved')}>{t('req.resolved')}</button>
          </div>
        </div>
        <div className="col g16 overflow-y-auto" style={{ maxHeight: '22.5rem' }}>
          {shown.length === 0 && <p className="t-sm t-mute">{filter === 'open' ? t('req.noOpenComments') : t('req.noResolved')}</p>}
          {shown.map((c) => (
            <div key={c.id} className="row g12" style={{ alignItems: 'flex-start' }}>
              <span className="flex flex-none items-center justify-center" style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: c.annotation ? 'var(--azul)' : 'var(--hielo)', color: c.annotation ? '#fff' : 'var(--azul-press)', font: '800 0.75rem/1 var(--f-text)' }}>{c.annotation ? pinNumber(c) : '·'}</span>
              <div className="col g4 grow">
                <span className="t-sm"><strong>{authorName(c)}</strong> <span className="t-mute">· {c.createdAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' })}{c.editedAt ? ` · ${t('ce.edited')}` : ''}</span></span>
                {typeof c.annotation?.t === 'number' && <button type="button" className="vm-at self-start" onClick={() => onSeek(markFile(c.annotation), c.annotation!.t!)} aria-label={t('vm.goTo', { t: clock(c.annotation.t) })}>▶ {clock(c.annotation.t)}</button>}
                {editing !== c.id && <p className="t-sm" style={{ whiteSpace: 'pre-line' }}>{c.kind === 'cancelled' ? t('rc.noteCancelled') : c.kind === 'reopened' ? t('rc.noteReopened') : c.text}</p>}
                {(c.author === user?.uid || profile?.role === 'admin') && (
                  <CommentEdit text={c.text} max={5000} editing={editing === c.id} setEditing={(on) => setEditing(on ? c.id : null)}
                    onSave={c.author === user?.uid ? (text) => updateDoc(cRef(c), { text, editedAt: serverTimestamp() }) : undefined} onDelete={() => deleteDoc(cRef(c))} />
                )}
                {markedOn(c) && <button className="t-xs t-mute truncate self-start" title={markedOn(c)!.name} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, maxWidth: '100%' }} onClick={() => onShowFile(markFile(c.annotation))}>{t('vw.onFile', { name: markedOn(c)!.name })}</button>}
                {(c.author === user?.uid || canApprove) && <button className="t-xs w7 self-start" style={{ background: 'none', border: 0, color: 'var(--azul)', cursor: 'pointer', padding: 0 }} onClick={() => resolve(c)}>{c.resolved ? t('req.reopen') : t('req.resolve')}</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="col g8" style={{ marginTop: 'auto' }}>
          <label htmlFor="cmt" className="t-sm w7">{typeof pendingMark?.t === 'number' ? t('vm.onMoment', { t: clock(pendingMark.t) }) : pendingMark ? t('req.commentOnMark') : t('req.addComment')}</label>
          <div className="row g8">
            <input className="input" id="cmt" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={t('req.commentPh')} />
            <button className="btn btn-primary btn-icon" aria-label={t('req.sendComment')} onClick={send} disabled={!text.trim()}><Icon name="arrowLeft" className="rotate-180" /></button>
          </div>
          <ObjectionHint brandId={brandId} o={objection} />
          {pendingMark && <button className="t-xs self-start" style={{ background: 'none', border: 0, color: 'var(--graphite)', cursor: 'pointer', padding: 0 }} onClick={clearMark}>{t('req.cancelMark')}</button>}
          <span className="t-xs t-mute">{t('req.changesHint')}</span>
        </div>
      </div>
    </aside>
  );
}
