import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { pct, pointsFor } from './SiteChanges';
/** On a site or app card: its adjustments at a glance, and the way in (opening it shows the page beside its triage). */
export function LinkAdjust({ link, links, all, onOpen }) {
    const { t } = useI18n();
    const list = pointsFor(all, link, links);
    const open = list.filter((x) => x.status !== 'delivered' && x.status !== 'discarded').length;
    return (_jsxs("button", { type: "button", className: "ladj", onClick: onOpen, children: [_jsxs("span", { className: "row between g8", children: [_jsx("span", { className: "t-sm w7", children: t('site.title') }), list.length > 0 && _jsxs("span", { className: "ladj-pct", children: [_jsx("b", { children: pct(list) }), "% ", t('site.pct')] })] }), list.length > 0 && _jsx("span", { className: "ladj-bar", "aria-hidden": "true", children: _jsx("span", { style: { width: `${pct(list)}%` } }) }), _jsx("span", { className: "t-xs t-mute", children: list.length ? t('ladj.some', { n: open }) : t('ladj.none') })] }));
}
