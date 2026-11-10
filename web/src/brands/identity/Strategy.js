import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useI18n } from '../../i18n/I18nProvider';
import { scanBlocks } from '../../lib/scan';
import { bold } from '../../components/Scan';
/** The strategy NickMark defined (the signed Brand Brain): what the client most needs to see and share. */
export function Strategy({ brain }) {
    const { t } = useI18n();
    const items = [
        ['brand.audiences', brain.audiences], ['brand.goals', brain.goals], ['brand.avoid', brain.avoid],
    ];
    const comps = (brain.competitors ?? []).filter((c) => c.name);
    return (_jsxs("div", { className: "col g20", children: [brain.position && (_jsxs("div", { className: "stage col g12 rounded-[24px] p-6 sm:p-10", children: [_jsx("p", { className: "label", children: t('brand.position') }), _jsx("p", { className: "d-lg d-fit d-fit-lg", style: { color: '#fff' }, children: brain.position }), _jsxs("span", { className: "row g8", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-7 w-7 rounded-full object-cover" }), _jsx("span", { className: "t-xs muted", children: brain.status === 'signed' ? t('brand.signedBy') : t('brand.draftBy') })] })] })), _jsx("div", { className: "grid gap-5 md:grid-cols-3", children: items.filter(([, v]) => v).map(([k, v]) => (_jsxs("div", { className: `card col g12 sfield sf-${k.split('.')[1]}`, children: [_jsx("p", { className: "label", children: t(k) }), _jsx(Field, { text: v, list: k === 'brand.avoid' })] }, k))) }), comps.length > 0 && (_jsxs("div", { className: "card col g12", children: [_jsx("p", { className: "label", children: t('brand.competitors') }), comps.map((c) => (_jsxs("div", { className: "row between g12 wrap t-sm", children: [_jsx("span", { className: "w7", children: c.name }), _jsx("span", { className: "t-mute", children: [c.promise, c.price].filter(Boolean).join(' · ') })] }, c.name)))] }))] }));
}
export const hasStrategy = (b) => !!b && !!(b.position || b.audiences || b.goals || b.avoid);
/** A strategy text made to scan: an intro, then one point per line with its key in bold (comma lists too for "avoid"). */
function Field({ text, list }) {
    return (_jsx(_Fragment, { children: scanBlocks(text, { list, points: true }).map((b, i) => b.kind === 'list' ? (_jsx("ul", { className: "sf-list", children: b.items.map((x, j) => _jsx("li", { children: _jsx("span", { className: "sf-v", children: bold(x) }) }, j)) }, i)) : _jsx("p", { className: i === 0 ? 'sf-intro' : 'sf-v', children: bold(b.text) }, i)) }));
}
