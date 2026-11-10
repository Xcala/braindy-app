import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { createRequest } from '../requests/api';
import { useRequests } from '../requests/useRequests';
const hostOf = (url) => { try {
    return url ? new URL(url).host.replace(/^www\./, '') : '';
}
catch {
    return '';
} };
/** Adjustment requests the client sent from this site that Builder has not turned into a point yet. */
function useReceived(brandId, url) {
    const { list } = useRequests(brandId);
    const host = hostOf(url);
    return list.filter((r) => r.category === 'web' && !r.archived && r.status !== 'approved' && r.status !== 'published'
        && /^(Ajuste del sitio|Site adjustment)/.test(r.title) && (r.cards?.product?.links ?? []).some((l) => hostOf(l) === host));
}
/**
 * "Adjust" tab, top: one line that opens a box to ask for an adjustment (a web request routed to Builder, with the site's
 * address attached), and what was already sent and is waiting for Builder. Talking about a part of the page is the Comment tab.
 */
export function SiteAsk({ brandId, url }) {
    const { t } = useI18n();
    const received = useReceived(brandId, url);
    const [openBox, setOpenBox] = useState(false);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    async function send(e) {
        e.preventDefault();
        const v = text.trim();
        if (!v)
            return;
        setBusy(true);
        setError(false);
        try {
            await createRequest(brandId, {
                category: 'web', title: `${t('sp.reqTitle')}: ${v.split('\n')[0].slice(0, 70)}`,
                cards: { product: { text: v, links: [url], files: [] } },
            });
            setText('');
            setOpenBox(false);
        }
        catch {
            setError(true);
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "col g8", children: [!openBox ? (_jsxs("button", { type: "button", className: "btn btn-secondary btn-sm self-start", onClick: () => setOpenBox(true), children: ["\uFF0B ", t('sp.askOpen')] })) : (_jsxs("form", { className: "spanel-ask col g8", onSubmit: send, children: [_jsx("label", { htmlFor: "sp-ask", className: "w7 t-sm", children: t('sp.ask') }), _jsx("textarea", { id: "sp-ask", className: "input", rows: 3, autoFocus: true, value: text, maxLength: 4000, placeholder: t('sp.askPh'), onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey))
                            send(e); } }), _jsxs("p", { className: "t-xs t-mute", style: { margin: 0 }, children: [t('sp.askHint'), " ", t('sp.askHelp')] }), _jsxs("div", { className: "row between g8", children: [_jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => { setOpenBox(false); setText(''); }, children: t('sc.cancel') }), _jsx("button", { type: "submit", className: "btn btn-primary btn-sm", disabled: busy || !text.trim(), children: busy ? `${t('sp.sending')}…` : t('sp.send') })] }), error && _jsx("p", { className: "help err", role: "alert", style: { margin: 0 }, children: t('sp.error') })] })), received.length > 0 && (_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", style: { margin: 0 }, children: t('sp.received') }), received.map((r) => (_jsxs(Link, { to: `/requests/${r.id}`, className: "spanel-pt spanel-recv", children: [_jsx("span", { className: "spanel-ptitle", children: (r.cards?.product?.text ?? r.title).split('\n')[0].slice(0, 90) }), _jsxs("span", { className: "t-xs t-mute", children: [t('sp.seeRequest'), " \u2192"] })] }, r.id)))] }))] }));
}
