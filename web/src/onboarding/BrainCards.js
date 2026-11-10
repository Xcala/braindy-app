import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { Scan } from '../components/Scan';
const CARDS = [
    { key: 'voice', title: 'ob.b.voice', source: 'ob.b.fromAnswers' },
    { key: 'audiences', title: 'ob.b.audiences', source: 'ob.b.fromAnswers' },
    { key: 'lookAndFeel', title: 'ob.b.look', source: 'ob.b.fromFiles' },
    { key: 'goals', title: 'ob.b.goals', source: 'ob.b.fromAnswers' },
    { key: 'avoid', title: 'ob.b.avoid', source: 'ob.b.fromAnswers' },
    { key: 'position', title: 'ob.b.position', source: 'ob.b.nicolasWrites', adminOnly: true },
    { key: 'criterio', title: 'ob.b.criterio', source: 'ob.b.everyPiece', adminOnly: true },
];
/** Brand Brain cards (design 17 day 1 / 18). Read-only for clients; editable for Nicolas before signing. */
export function BrainCards({ brain, onChange }) {
    const { t } = useI18n();
    const edit = !!onChange;
    const comps = brain.competitors ?? [];
    const setComp = (i, k, v) => onChange?.({ ...brain, competitors: comps.map((c, j) => (j === i ? { ...c, [k]: v } : c)) });
    return (_jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0", children: [CARDS.filter((c) => edit || !c.adminOnly || brain[c.key]).map((c) => (_jsxs("div", { className: "card col g8", style: { padding: 22 }, children: [_jsxs("div", { className: "row between g8", children: [_jsx("h3", { className: "h3", children: t(c.title) }), _jsx("span", { className: "t-xs t-mute", children: t(c.source) })] }), edit
                        ? _jsx("textarea", { className: "input", rows: 4, value: brain[c.key] ?? '', onChange: (e) => onChange({ ...brain, [c.key]: e.target.value }), "aria-label": t(c.title), style: { height: 'auto', paddingTop: 10 } })
                        : brain[c.key] ? _jsx(Scan, { text: brain[c.key], points: true, list: c.key === 'avoid', tone: "ink" }) : _jsx("p", { className: "t-sm t-mute", children: t('ob.b.empty') })] }, c.key))), _jsxs("div", { className: "card col g8 md:col-span-2", style: { padding: 22 }, children: [_jsxs("div", { className: "row between g8", children: [_jsx("h3", { className: "h3", children: t('ob.b.competitors') }), _jsx("span", { className: "t-xs t-mute", children: t('ob.b.researcherRead') })] }), _jsxs("div", { className: "table overflow-x-auto", children: [_jsxs("div", { className: "trow head label min-w-[480px]", style: { gridTemplateColumns: edit ? '1fr 1.4fr 1fr 1.2fr' : '1fr 1.4fr 1fr' }, children: [_jsx("span", { children: t('ob.b.name') }), _jsx("span", { children: t('ob.b.promise') }), _jsx("span", { children: t('ob.b.price') }), edit && _jsx("span", { children: t('brains.site') })] }), comps.length === 0 && _jsx("p", { className: "t-sm t-mute", style: { padding: 12 }, children: t('ob.b.empty') }), comps.map((c, i) => (_jsx("div", { className: "trow min-w-[480px]", style: { gridTemplateColumns: edit ? '1fr 1.4fr 1fr 1.2fr' : '1fr 1.4fr 1fr' }, children: (edit ? ['name', 'promise', 'price', 'url'] : ['name', 'promise', 'price']).map((k) => edit
                                    ? _jsx("input", { className: "input", style: { height: 36 }, value: c[k] ?? '', placeholder: k === 'url' ? 'https://' : undefined, onChange: (e) => setComp(i, k, e.target.value), "aria-label": `${k === 'url' ? t('brains.site') : t(`ob.b.${k}`)} ${i + 1}` }, k)
                                    : _jsx("span", { className: "t-sm", children: c[k] || '—' }, k)) }, i)))] }), edit && _jsx("button", { className: "btn btn-ghost btn-sm", style: { alignSelf: 'flex-start' }, onClick: () => onChange({ ...brain, competitors: [...comps, { name: '', promise: '', price: '' }] }), children: t('ob.b.addCompetitor') })] })] }));
}
