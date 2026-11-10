import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Point } from './SitePoint';
import { CommentItem } from './SiteComments';
/**
 * "Delivered" tab: everything that already happened, newest first: delivered adjustments and resolved comments,
 * each with its date and a label saying which one it is.
 */
export function SiteDone({ brandId, points, comments, frame }) {
    const { t, lang } = useI18n();
    const [openComment, setOpenComment] = useState(null);
    const rows = [
        ...points.filter((x) => x.status === 'delivered').map((x) => ({ id: x.id, kind: 'adjust', x, ts: x.updatedAt, at: x.updatedAt?.toMillis() ?? 0 })),
        ...comments.filter((c) => c.resolved).map((c) => ({ id: c.id, kind: 'comment', c, ts: c.resolvedAt, at: c.resolvedAt?.toMillis() ?? 0 })),
    ].sort((a, b) => b.at - a.at);
    const when = (ts) => ts?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }) ?? '';
    if (rows.length === 0)
        return _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('sp.doneEmpty') });
    return (_jsx("div", { className: "col g8", children: rows.map((r) => (_jsxs("div", { className: "col g4", children: [_jsxs("p", { className: "label sdone-kind", style: { margin: 0 }, children: [t(r.kind === 'adjust' ? 'sp.kindAdjust' : 'sp.kindComment'), r.ts ? ` · ${when(r.ts)}` : ''] }), r.kind === 'adjust'
                    ? _jsx(Point, { brandId: brandId, x: r.x, onShow: frame?.go, on: frame?.active === r.x.key })
                    : _jsx(CommentItem, { brandId: brandId, c: r.c, frame: frame, open: openComment === r.c.id, onOpen: setOpenComment })] }, `${r.kind}-${r.id}`))) }));
}
