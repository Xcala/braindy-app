import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { NewVersionDialog } from './NewVersionDialog';
/**
 * Top of Mi marca on a rebranded brand: the current version and the earlier ones as chips; an earlier one opens
 * read-only. The admin also gets «New brand version» here (for brands never rebranded, only that button shows).
 * In Deliveries (Files, Apps) the same bar shows the work of each version; there it never opens a new one.
 */
export function VersionBar({ brand, versions, viewing, onView, isAdmin = false, work = false }) {
    const { t, lang } = useI18n();
    const [asking, setAsking] = useState(false);
    const year = (d) => (d ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', year: 'numeric' }).format(d) : '');
    const old = versions.find((v) => v.id === viewing);
    if (!versions.length && !isAdmin)
        return null;
    return (_jsxs("div", { className: "col g12", children: [_jsxs("div", { className: "row g8 wrap", style: { alignItems: 'center' }, children: [versions.length > 0 && (_jsxs("div", { className: "seg seg-scroll", role: "group", "aria-label": t('ver.bar'), children: [_jsxs("button", { type: "button", className: viewing ? '' : 'is-on', "aria-pressed": !viewing, onClick: () => onView(null), children: [brand.name, " \u00B7 ", t('ver.current')] }), versions.map((v) => (_jsxs("button", { type: "button", className: viewing === v.id ? 'is-on' : '', "aria-pressed": viewing === v.id, onClick: () => onView(v.id), children: [v.name, " \u00B7 ", v.from ? t('ver.range', { from: year(v.from), to: year(v.to) }) : t('ver.until', { date: year(v.to) })] }, v.id)))] })), isAdmin && !viewing && _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", style: { marginLeft: 'auto' }, onClick: () => setAsking(true), children: t('ver.new') })] }), old && (_jsxs("div", { className: "card row g12 wrap between", role: "status", style: { padding: '12px 16px' }, children: [_jsx("span", { className: "t-sm", children: t(work ? 'ver.viewingWork' : 'ver.viewing', { name: old.name }) }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => onView(null), children: t('ver.backToCurrent') })] })), asking && _jsx(NewVersionDialog, { brand: brand, onClose: () => setAsking(false) })] }));
}
