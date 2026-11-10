import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { STATUSES } from './SiteChanges';
/** One triage point, folded to its title and state; opens to what was asked and what was done. NickMark changes the state here. */
export function Point({ brandId, x, onShow, on }) {
    const { t } = useI18n();
    const isAdmin = useAuth().profile?.role === 'admin';
    return (
    // Opening a point takes the site beside it to where the point lives.
    _jsxs("details", { className: `spanel-pt is-${x.status}${on ? ' is-on' : ''}`, onToggle: (e) => { if (e.currentTarget.open && onShow && (x.link || x.spot))
            onShow({ url: x.link, spot: x.spot, label: x.key, auto: true }); }, children: [_jsxs("summary", { children: [_jsx("span", { className: "sx-key", children: x.key }), _jsx("span", { className: "spanel-ptitle", children: x.title }), _jsx("span", { className: `sx-status is-${x.status}`, children: t(`site.status.${x.status}`) })] }), isAdmin && (_jsx("select", { className: `sx-status spanel-set is-${x.status}`, "aria-label": `${t('site.state')} ${x.key}`, value: x.status, onChange: (e) => updateDoc(doc(db, 'brands', brandId, 'siteChanges', x.id), { status: e.target.value, updatedAt: serverTimestamp() }), children: STATUSES.map((s) => _jsx("option", { value: s, children: t(`site.status.${s}`) }, s)) })), x.request && _jsxs("p", { className: "t-xs", children: [_jsx("span", { className: "sx-lbl", children: t('site.asked') }), " ", x.request] }), x.delivered && _jsxs("p", { className: "t-xs", children: [_jsx("span", { className: "sx-lbl", children: t('site.done') }), " ", x.delivered] }), onShow && (x.link || x.spot)
                ? _jsx("button", { type: "button", className: "sx-link t-xs", onClick: () => onShow({ url: x.link, spot: x.spot, label: x.key }), children: t('sp.showOnPage') })
                : x.link && _jsxs("a", { className: "sx-link t-xs", href: x.link, target: "_blank", rel: "noreferrer", children: [t('site.seeChange'), " \u2197"] })] }));
}
