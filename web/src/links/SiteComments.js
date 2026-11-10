import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, deleteField, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { CommentEdit } from '../components/CommentEdit';
import { samePage } from './useSpot';
const hostOf = (url) => { try {
    return url ? new URL(url).host.replace(/^www\./, '') : '';
}
catch {
    return '';
} };
const pathOf = (url) => { try {
    return decodeURI(new URL(url).pathname);
}
catch {
    return url;
} };
export function useSiteComments(brandId, siteUrl) {
    const [list, setList] = useState([]);
    useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'siteComments'), orderBy('createdAt')), (s) => setList(s.docs.map((d, i) => ({ id: d.id, n: i + 1, ...d.data() }))), () => setList([])), [brandId]);
    const host = hostOf(siteUrl);
    return useMemo(() => list.filter((c) => hostOf(c.url) === host), [list, host]);
}
/**
 * "Comment" tab: one line says how (write it, or click the part of the page), the box is always there and the page is already
 * listening for a click. A click pins the comment on that part; without a click it is a general comment on the page shown.
 * Only open comments are listed here: resolved ones live in the Delivered tab.
 */
export function SiteComments({ brandId, siteUrl, list, frame, onToPoint }) {
    const { t } = useI18n();
    const { user, profile } = useAuth();
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [open, setOpen] = useState(null);
    const [where, setWhere] = useState('');
    const bridge = !!frame?.hasBridge;
    const open_ = list.filter((c) => !c.resolved).reverse();
    // Pins of the open comments on the page the frame shows (general comments have no place to pin).
    const page = frame?.page;
    const setPins = frame?.setPins;
    useEffect(() => {
        if (!setPins || !page)
            return;
        setPins(list.filter((c) => !c.resolved && c.spot && samePage(c.url, page)).map((c) => ({ id: c.id, n: c.n, selector: c.spot?.selector, text: c.spot?.text, x: c.spot?.x, y: c.spot?.y })));
    }, [list, page, setPins]);
    // A pin clicked on the site opens its comment here.
    const pinned = frame?.pinned;
    useEffect(() => { if (pinned) {
        setOpen(pinned);
        frame?.clearPinned();
    } }, [pinned, frame]);
    async function send(e) {
        e.preventDefault();
        const v = text.trim(), p = frame?.picked;
        if (!v || !user)
            return;
        setBusy(true);
        setError(false);
        try {
            await addDoc(collection(db, 'brands', brandId, 'siteComments'), {
                author: user.uid, authorName: (profile?.name ?? '').slice(0, 120), text: v.slice(0, 2000), url: (p?.url ?? page ?? siteUrl).slice(0, 1000),
                ...(p ? { spot: { selector: p.selector.slice(0, 500), text: p.text.slice(0, 120), x: p.x, y: p.y } } : {}),
                ...(!bridge && where.trim() ? { where: where.trim().slice(0, 200) } : {}),
                resolved: false, createdAt: serverTimestamp(),
            });
            setText('');
            setWhere('');
            frame?.clearPicked();
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    const p = frame?.picked;
    return (_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "t-sm", style: { margin: 0 }, children: t(bridge ? 'sc.hint' : 'sc.hintNoBridge') }), bridge && frame?.picking && (_jsxs("div", { className: "sc-picking row between g8", children: [_jsx("span", { className: "t-sm", children: t('sc.pickOn') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => frame.setPicking(false), children: t('sc.cancel') })] })), bridge && frame && !frame.picking && !p && (_jsxs("button", { type: "button", className: "btn btn-secondary btn-sm self-start", onClick: () => frame.setPicking(true), children: ["\u2316 ", t('sc.pickAgain')] })), _jsxs("form", { className: "spanel-ask col g8", onSubmit: send, children: [!bridge && _jsx("input", { className: "input", value: where, maxLength: 200, placeholder: t('sc.where'), "aria-label": t('sc.where'), onChange: (e) => setWhere(e.target.value) }), bridge && _jsx("p", { className: "t-xs t-mute", style: { margin: 0 }, children: p ? _jsxs(_Fragment, { children: [t('sc.about'), " ", p.text ? `«${p.text}»` : pathOf(p.url), " \u00B7 ", _jsx("button", { type: "button", className: "spanel-textbtn", onClick: () => frame?.clearPicked(), children: t('sc.dropSpot') })] })
                            : _jsxs(_Fragment, { children: [t('sc.general'), " \u00B7 ", pathOf(page ?? siteUrl) || '/'] }) }), _jsx("textarea", { className: "input", rows: 3, value: text, maxLength: 2000, placeholder: t('sc.ph'), "aria-label": t('sc.ph'), onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey))
                            send(e); } }), _jsxs("div", { className: "row g8 between", children: [_jsx("span", {}), _jsx("button", { type: "submit", className: "btn btn-primary btn-sm", disabled: busy || !text.trim(), children: t('sc.send') })] }), error && _jsx("p", { className: "help err", role: "alert", style: { margin: 0 }, children: t('sc.error') })] }), open_.length === 0 && _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('sc.empty') }), open_.map((c) => _jsx(CommentItem, { brandId: brandId, c: c, frame: frame, open: open === c.id, onOpen: setOpen, onToPoint: onToPoint }, c.id))] }));
}
/** One comment: folded to its number, author and text; opening it takes the site to its pin and shows the replies. */
export function CommentItem({ brandId, c, frame, open, onOpen, onToPoint }) {
    const { t, lang } = useI18n();
    const { user, profile } = useAuth();
    const ref = useRef(null);
    const [replies, setReplies] = useState([]);
    const [text, setText] = useState('');
    const [editing, setEditing] = useState(null);
    const isAdmin = profile?.role === 'admin';
    const canResolve = isAdmin || c.author === user?.uid;
    const cref = doc(db, 'brands', brandId, 'siteComments', c.id);
    useEffect(() => {
        if (!open)
            return;
        ref.current?.scrollIntoView({ block: 'nearest' });
        return onSnapshot(query(collection(cref, 'replies'), orderBy('createdAt')), (s) => setReplies(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setReplies([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, brandId, c.id]);
    const when = (ts) => ts?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }) ?? '';
    async function reply(e) {
        e.preventDefault();
        const v = text.trim();
        if (!v || !user)
            return;
        await addDoc(collection(cref, 'replies'), { author: user.uid, authorName: (profile?.name ?? '').slice(0, 120), text: v.slice(0, 2000), createdAt: serverTimestamp() });
        setText('');
    }
    const resolve = (v) => updateDoc(cref, v ? { resolved: true, resolvedBy: user?.uid ?? '', resolvedAt: serverTimestamp() } : { resolved: false, resolvedBy: deleteField(), resolvedAt: deleteField() });
    return (_jsxs("details", { ref: ref, className: `spanel-pt sc-item${c.resolved ? ' is-done' : ''}`, open: open, onToggle: (e) => {
            const isOpen = e.currentTarget.open;
            if (isOpen === open)
                return;
            onOpen(isOpen ? c.id : null);
            if (isOpen)
                frame?.go({ url: c.url, spot: c.spot?.selector || c.spot?.text, label: `#${c.n}`, auto: true });
        }, children: [_jsxs("summary", { children: [_jsx("span", { className: "sc-n", children: c.n }), _jsxs("span", { className: "spanel-ptitle", children: [_jsx("b", { children: c.authorName || t('sc.someone') }), " ", c.text, c.editedAt ? _jsxs("span", { className: "t-mute", children: [" \u00B7 ", t('ce.edited')] }) : null] })] }), _jsxs("p", { className: "t-xs t-mute", children: [pathOf(c.url), " \u00B7 ", when(c.createdAt), c.spot?.text ? ` · «${c.spot.text}»` : '', c.where ? ` · ${t('sc.whereIs')}: ${c.where}` : ''] }), (c.author === user?.uid || isAdmin) && (_jsxs("div", { style: { margin: '0 12px 8px' }, children: [editing === c.id && _jsx("p", { className: "t-xs t-mute", children: t('ce.label') }), _jsx(CommentEdit, { text: c.text, max: 2000, editing: editing === c.id, setEditing: (on) => setEditing(on ? c.id : null), onSave: c.author === user?.uid ? (v) => updateDoc(cref, { text: v, editedAt: serverTimestamp() }) : undefined, onDelete: () => deleteDoc(cref) })] })), replies.map((r) => {
                const rref = doc(cref, 'replies', r.id);
                return (_jsxs("div", { className: "sc-reply col g4", children: [editing !== r.id && _jsxs("p", { className: "t-xs", children: [_jsx("b", { children: r.authorName || t('sc.someone') }), " ", r.text, " ", _jsxs("span", { className: "t-mute", children: ["\u00B7 ", when(r.createdAt), r.editedAt ? ` · ${t('ce.edited')}` : ''] })] }), (r.author === user?.uid || isAdmin) && _jsx(CommentEdit, { text: r.text, max: 2000, editing: editing === r.id, setEditing: (on) => setEditing(on ? r.id : null), onSave: r.author === user?.uid ? (v) => updateDoc(rref, { text: v, editedAt: serverTimestamp() }) : undefined, onDelete: () => deleteDoc(rref) })] }, r.id));
            }), _jsxs("form", { className: "row g8", onSubmit: reply, children: [_jsx("input", { className: "input", value: text, maxLength: 2000, placeholder: t('sc.replyPh'), "aria-label": t('sc.replyPh'), onChange: (e) => setText(e.target.value) }), _jsx("button", { type: "submit", className: "btn btn-secondary btn-sm", disabled: !text.trim(), children: t('sc.reply') })] }), _jsxs("div", { className: "row g8 wrap", style: { margin: '0 12px 10px' }, children: [canResolve && _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => resolve(!c.resolved), children: c.resolved ? t('sc.reopen') : `✓ ${t('sc.resolve')}` }), isAdmin && onToPoint && !c.resolved && (c.asPoint
                        ? _jsx("span", { className: "t-xs t-mute", children: t('sc.asPoint', { key: c.asPoint }) })
                        : _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => onToPoint(c), children: t('sc.toPoint') }))] })] }));
}
