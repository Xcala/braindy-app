import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { brainName } from '../components/BrainStack';
import { ObjectionHint, useObjectionMatch } from '../criterio/LessonCards';
import { logObjection } from '../criterio/useCriterio';
import { decide } from './api';
import { markFile } from './useFileUrl';
import { clock } from './VideoMarks';
import { AdaptDialog } from './AdaptDialog';
import { VersionNotes } from './VersionNotes';
import { Scan } from '../components/Scan';
import { CommentEdit } from '../components/CommentEdit';
import { useToast } from '../components/Toaster';
import { LearnedMoment } from '../brain/BrainLearned';
/** Right panel of the review screen: who made it and why, the decision, and the comments. */
export function ReviewPanel({ brandId, r, v, comments, canApprove, pendingMark, clearMark, onShowFile, onSeek }) {
    const { t, lang } = useI18n();
    const { user, profile } = useAuth();
    const [text, setText] = useState('');
    const objection = useObjectionMatch(text);
    const sentAnyway = () => { if (objection)
        logObjection(brandId, objection.id, 'sent'); };
    const [filter, setFilter] = useState('open');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null);
    const [adapting, setAdapting] = useState(false);
    const [learned, setLearned] = useState(null);
    const cRef = (c) => doc(db, 'brands', brandId, 'requests', r.id, 'comments', c.id);
    const isLatest = v && r.latestVersion === v.id;
    const pending = v?.published && v.approval?.state === 'pending';
    const shown = comments.filter((c) => (filter === 'resolved' ? c.resolved : !c.resolved));
    // Numbered per file, as the pins on the piece are.
    const pinNumber = (c) => comments.filter((x) => x.annotation && x.annotation.versionId === c.annotation?.versionId && markFile(x.annotation) === markFile(c.annotation)).indexOf(c) + 1;
    const markedOn = (c) => (c.annotation && (v?.files?.length ?? 0) > 1 ? v?.files?.[markFile(c.annotation)] : undefined);
    const authorName = (c) => (c.author === user?.uid ? t('req.you') : c.kind === 'changes_requested' ? t('req.changesRequested') : t('req.team'));
    async function send() {
        if (!text.trim() || !user)
            return;
        await addDoc(collection(db, 'brands', brandId, 'requests', r.id, 'comments'), {
            author: user.uid, text: text.trim(), createdAt: serverTimestamp(),
            ...(pendingMark ? { annotation: pendingMark, versionId: pendingMark.versionId } : v ? { versionId: v.id } : {}),
        });
        sentAnyway();
        setText('');
        clearMark();
    }
    async function decision(state) {
        if (!v)
            return;
        setError('');
        const openOnVersion = comments.some((c) => !c.resolved && c.versionId === v.id);
        if (state === 'changes_requested' && !text.trim() && !openOnVersion) {
            setError(t('req.changesNeedComment'));
            return;
        }
        setBusy(true);
        const note = state === 'changes_requested' ? text.trim() || t('req.seeComments') : '';
        try {
            await decide(brandId, r.id, v.id, state, note);
            if (state === 'changes_requested')
                sentAnyway();
            // The same thing the Brand Brain records on the server (brains/learn.ts): what was liked, or what to change.
            setLearned(state === 'approved' ? { kind: 'approved', text: v.reason || v.notes || '' } : { kind: 'changed', text: note });
            setText('');
            clearMark();
        }
        catch {
            setError(t('req.decisionError'));
        }
        finally {
            setBusy(false);
        }
    }
    const toast = useToast();
    const setResolved = (c, resolved) => user && updateDoc(doc(db, 'brands', brandId, 'requests', r.id, 'comments', c.id), { resolved, resolvedBy: user.uid, resolvedAt: serverTimestamp() });
    const resolve = async (c) => {
        await setResolved(c, !c.resolved);
        toast({ text: t(c.resolved ? 'toast.reopened' : 'toast.resolved'), undo: () => setResolved(c, !!c.resolved) });
    };
    return (_jsxs("aside", { className: "col min-h-0", style: { borderLeft: '1px solid var(--line)' }, children: [v && (_jsxs("div", { className: "col g12", style: { padding: 20, borderBottom: '1px solid var(--line)' }, children: [_jsxs("span", { className: "row g8", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-8 w-8 flex-none rounded-full object-cover" }), (v.brain ?? r.leadBrain) && _jsx("img", { src: `/brand/brains/${v.brain ?? r.leadBrain}.png`, alt: "", className: "h-8 w-8 flex-none rounded-full", style: { marginLeft: -12, boxShadow: '0 0 0 2px #fff', background: 'var(--niebla)' } }), _jsx("span", { className: "t-sm", children: r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(v.brain ?? r.leadBrain) }) })] }), v.notes && _jsx(VersionNotes, { text: v.notes }), v.reason && _jsxs("div", { className: "col", style: { gap: 6, padding: '14px 16px', borderRadius: 14, background: 'var(--hielo)' }, children: [_jsx("span", { className: "t-sm w7", children: t('req.whyItWorks') }), _jsx(Scan, { text: v.reason, points: true, tone: "ink" }), _jsx("span", { className: "t-xs t-mute", children: t('req.everyPieceReason') })] }), v.approval?.state === 'approved' && (_jsxs("div", { className: "row g8 wrap", children: [_jsx("span", { className: "chip c-approved", children: t('req.approvedChip', { n: v.n }) }), _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setAdapting(true), children: [_jsx(Icon, { name: "plus", size: 16 }), t('ad.btn')] })] })), adapting && _jsx(AdaptDialog, { brandId: brandId, r: r, v: v, onClose: () => setAdapting(false) }), v.approval?.state === 'changes_requested' && _jsx("span", { className: "chip c-approve self-start", children: t('req.changesChip') }), canApprove && pending && isLatest && (_jsxs("div", { className: "row g8", "data-tour": "review-decide", children: [_jsxs("button", { className: "btn btn-primary grow", disabled: busy, onClick: () => decision('approved'), children: [_jsx(Icon, { name: "check" }), t('req.approveV', { n: v.n })] }), _jsx("button", { className: "btn btn-secondary grow", disabled: busy, onClick: () => decision('changes_requested'), children: t('req.requestChanges') })] })), !canApprove && pending && isLatest && profile?.role !== 'admin' && _jsx("p", { className: "t-xs t-mute", children: t('req.cannotApprove') }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: error }), learned && _jsx(LearnedMoment, { kind: learned.kind, text: learned.text })] })), _jsxs("div", { className: "col g16 min-h-0 flex-1", style: { padding: 20 }, "data-tour": "review-comments", children: [_jsxs("div", { className: "row between", children: [_jsx("p", { className: "label", children: t('req.comments') }), _jsxs("div", { className: "seg", role: "group", "aria-label": t('req.filterComments'), children: [_jsx("button", { className: filter === 'open' ? 'is-on' : '', onClick: () => setFilter('open'), children: t('req.open') }), _jsx("button", { className: filter === 'resolved' ? 'is-on' : '', onClick: () => setFilter('resolved'), children: t('req.resolved') })] })] }), _jsxs("div", { className: "col g16 overflow-y-auto", style: { maxHeight: 360 }, children: [shown.length === 0 && _jsx("p", { className: "t-sm t-mute", children: filter === 'open' ? t('req.noOpenComments') : t('req.noResolved') }), shown.map((c) => (_jsxs("div", { className: "row g12", style: { alignItems: 'flex-start' }, children: [_jsx("span", { className: "flex flex-none items-center justify-center", style: { width: 28, height: 28, borderRadius: '50%', background: c.annotation ? 'var(--azul)' : 'var(--hielo)', color: c.annotation ? '#fff' : 'var(--azul-press)', font: '800 12px/1 var(--f-text)' }, children: c.annotation ? pinNumber(c) : '·' }), _jsxs("div", { className: "col g4 grow", children: [_jsxs("span", { className: "t-sm", children: [_jsx("strong", { children: authorName(c) }), " ", _jsxs("span", { className: "t-mute", children: ["\u00B7 ", c.createdAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }), c.editedAt ? ` · ${t('ce.edited')}` : ''] })] }), typeof c.annotation?.t === 'number' && _jsxs("button", { type: "button", className: "vm-at self-start", onClick: () => onSeek(markFile(c.annotation), c.annotation.t), "aria-label": t('vm.goTo', { t: clock(c.annotation.t) }), children: ["\u25B6 ", clock(c.annotation.t)] }), editing !== c.id && _jsx("p", { className: "t-sm", style: { whiteSpace: 'pre-line' }, children: c.text }), (c.author === user?.uid || profile?.role === 'admin') && (_jsx(CommentEdit, { text: c.text, max: 5000, editing: editing === c.id, setEditing: (on) => setEditing(on ? c.id : null), onSave: c.author === user?.uid ? (text) => updateDoc(cRef(c), { text, editedAt: serverTimestamp() }) : undefined, onDelete: () => deleteDoc(cRef(c)) })), markedOn(c) && _jsx("button", { className: "t-xs t-mute truncate self-start", title: markedOn(c).name, style: { background: 'none', border: 0, cursor: 'pointer', padding: 0, maxWidth: '100%' }, onClick: () => onShowFile(markFile(c.annotation)), children: t('vw.onFile', { name: markedOn(c).name }) }), (c.author === user?.uid || canApprove) && _jsx("button", { className: "t-xs w7 self-start", style: { background: 'none', border: 0, color: 'var(--azul)', cursor: 'pointer', padding: 0 }, onClick: () => resolve(c), children: c.resolved ? t('req.reopen') : t('req.resolve') })] })] }, c.id)))] }), _jsxs("div", { className: "col g8", style: { marginTop: 'auto' }, children: [_jsx("label", { htmlFor: "cmt", className: "t-sm w7", children: typeof pendingMark?.t === 'number' ? t('vm.onMoment', { t: clock(pendingMark.t) }) : pendingMark ? t('req.commentOnMark') : t('req.addComment') }), _jsxs("div", { className: "row g8", children: [_jsx("input", { className: "input", id: "cmt", value: text, onChange: (e) => setText(e.target.value), onKeyDown: (e) => e.key === 'Enter' && send(), placeholder: t('req.commentPh') }), _jsx("button", { className: "btn btn-primary btn-icon", "aria-label": t('req.sendComment'), onClick: send, disabled: !text.trim(), children: _jsx(Icon, { name: "arrowLeft", className: "rotate-180" }) })] }), _jsx(ObjectionHint, { brandId: brandId, o: objection }), pendingMark && _jsx("button", { className: "t-xs self-start", style: { background: 'none', border: 0, color: 'var(--graphite)', cursor: 'pointer', padding: 0 }, onClick: clearMark, children: t('req.cancelMark') }), _jsx("span", { className: "t-xs t-mute", children: t('req.changesHint') })] })] })] }));
}
