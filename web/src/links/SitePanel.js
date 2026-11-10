import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { pct, pointsFor, STATUSES, useSiteChanges } from './SiteChanges';
import { SiteComments, useSiteComments } from './SiteComments';
import { SiteAsk } from './SiteAsk';
import { SiteDone } from './SiteDone';
import { Point } from './SitePoint';
/**
 * The narrow column beside the site in the viewer, in three tabs by what is happening to the work:
 * Adjust (what is open + ask for one more), Comment (talk about a part of the page: write it or click it) and
 * Delivered (everything that already happened: delivered adjustments and resolved comments, newest first).
 */
export function SitePanel({ brandId, link, links, frame }) {
    const { t, lang } = useI18n();
    const onShow = frame?.go, active = frame?.active;
    const comments = useSiteComments(brandId, link.url);
    const all = useSiteChanges(brandId);
    const list = pointsFor(all, link, links);
    const open = list.filter((x) => x.status !== 'delivered' && x.status !== 'discarded');
    const done = list.filter((x) => x.status === 'delivered');
    const openComments = comments.filter((c) => !c.resolved).length;
    const doneCount = done.length + comments.filter((c) => c.resolved).length;
    const total = pct(list);
    const counts = STATUSES.map((s) => [s, list.filter((x) => x.status === s).length]).filter(([, n]) => n);
    const [tab, setTab] = useState('adjust');
    // A pin clicked on the site, or comment mode turned on, brings the Comment tab forward.
    useEffect(() => { if (frame?.pinned || frame?.picking)
        setTab('comments'); }, [frame?.pinned, frame?.picking]);
    // In the Comment tab the page is already listening for a click; leaving the tab puts the page back to normal.
    useEffect(() => {
        if (!frame)
            return;
        if (tab === 'comments') {
            if (!frame.picked)
                frame.setPicking(true);
        }
        else if (frame.picking)
            frame.setPicking(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);
    /** NickMark turns a comment into an adjustment point (in progress); the comment keeps the key it became. */
    async function toPoint(c) {
        const nums = all.map((x) => /^CM(\d+)$/.exec(x.key)).filter((m) => !!m).map((m) => Number(m[1]));
        const key = `CM${String(Math.max(0, ...nums) + 1).padStart(2, '0')}`;
        const spot = c.spot?.text || c.spot?.selector;
        await addDoc(collection(db, 'brands', brandId, 'siteChanges'), {
            key, group: lang === 'es' ? 'Comentarios' : 'Comments', title: c.text.split('\n')[0].slice(0, 90), status: 'in_progress',
            request: `${c.authorName ? `${c.authorName}: ` : ''}${c.text}${c.where ? ` (${c.where})` : ''}`.slice(0, 1500), source: `${t('sp.kindComment')} #${c.n}`,
            link: c.url, ...(spot ? { spot } : {}), siteUrl: link.url,
            order: Math.max(-1, ...all.map((x) => x.order ?? 0)) + 1, updatedAt: serverTimestamp(), createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'brands', brandId, 'siteComments', c.id), { asPoint: key });
    }
    const tabs = [['adjust', t('sp.tAdjust'), open.length], ['comments', t('sp.tComment'), openComments], ['done', t('sp.tDone'), doneCount]];
    return (_jsxs("aside", { id: "site-panel", className: "spanel sx", "aria-labelledby": "sp-title", children: [_jsxs("header", { className: "col g8", children: [_jsxs("span", { className: "sx-by", children: [_jsx("span", { className: "brain b-builder", children: _jsx("img", { src: "/brand/brains/builder.png", alt: "" }) }), t('site.by')] }), _jsxs("div", { className: "row between g12", children: [_jsx("h2", { className: "h3", id: "sp-title", style: { margin: 0 }, children: t('site.title') }), list.length > 0 && _jsxs("button", { type: "button", className: "spanel-pct", "aria-label": `${total}% ${t('site.pct')}`, onClick: () => setTab('done'), children: [_jsx("b", { children: total }), "%"] })] }), list.length > 0 && _jsxs(_Fragment, { children: [_jsx("div", { className: "sx-bar", "aria-hidden": "true", children: counts.map(([s, n]) => _jsx("span", { className: `is-${s}`, style: { flexGrow: n } }, s)) }), _jsxs("p", { className: "t-xs spanel-legend", style: { margin: 0 }, children: [_jsx("button", { type: "button", className: "spanel-textbtn", onClick: () => setTab('done'), children: t('sp.nDone', { n: done.length }) }), ' · ', _jsx("button", { type: "button", className: "spanel-textbtn", onClick: () => setTab('adjust'), children: t('sp.nTodo', { n: open.length }) })] })] })] }), _jsx("div", { className: "seg sc-tabs", role: "tablist", "aria-label": t('site.title'), children: tabs.map(([id, label, n]) => (_jsxs("button", { type: "button", role: "tab", "aria-selected": tab === id, className: tab === id ? 'is-on' : '', onClick: () => setTab(id), children: [label, n ? ` (${n})` : ''] }, id))) }), tab === 'adjust' && (_jsxs("div", { className: "col g8", children: [_jsx(SiteAsk, { brandId: brandId, url: link.url }), open.length === 0 ? _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('sp.empty') }) : _jsxs(_Fragment, { children: [_jsx("p", { className: "label", style: { margin: 0 }, children: t('sp.nTodo', { n: open.length }) }), open.map((x) => _jsx(Point, { brandId: brandId, x: x, onShow: onShow, on: active === x.key }, x.id))] })] })), tab === 'comments' && _jsx(SiteComments, { brandId: brandId, siteUrl: link.url, list: comments, frame: frame, onToPoint: toPoint }), tab === 'done' && _jsx(SiteDone, { brandId: brandId, points: list, comments: comments, frame: frame })] }));
}
