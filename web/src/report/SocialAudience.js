import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
/** A labelled horizontal bar per row; n is the row's share of all followers per ten thousand (as the server stores it), unless fmt says how to show it. With top, only the first rows show and the rest open on demand; card makes the block its own card. */
export function Bars({ title, rows, fmt, sub, top, card }) {
    const { t, lang } = useI18n();
    const [open, setOpen] = useState(false);
    const more = top != null && rows.length > top;
    const max = Math.max(1, ...rows.map((r) => r.n));
    return (_jsxs("div", { className: card ? 'card col g8' : 'col g8', children: [_jsxs("div", { className: "col g4", children: [_jsx("p", { className: "label", children: title }), sub && _jsx("p", { className: "t-xs t-mute", children: sub })] }), (more && !open ? rows.slice(0, top) : rows).map((r) => (_jsxs("div", { className: "col g4", children: [_jsxs("div", { className: "row between t-sm", children: [_jsx("span", { style: { overflowWrap: 'anywhere' }, children: r.name }), _jsx("span", { className: "t-mute", style: { fontVariantNumeric: 'tabular-nums' }, children: fmt ? fmt(r.n) : new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { style: 'percent', maximumFractionDigits: 1 }).format(r.n / 10000) })] }), _jsx("div", { style: { height: 6, borderRadius: 999, background: 'var(--hielo)' }, children: _jsx("div", { style: { width: `${(r.n / max) * 100}%`, height: '100%', borderRadius: 999, background: '#2F4DE0' } }) })] }, r.name))), more && _jsx("button", { className: "btn btn-ghost btn-sm print:hidden", style: { alignSelf: 'flex-start' }, "aria-expanded": open, onClick: () => setOpen(!open), children: open ? t('common.showLess') : t('common.showAll', { n: rows.length }) })] }));
}
/** Who follows the brand: country, city, age and gender (Metricool's latest picture, not by period). */
export function SocialAudience({ audience }) {
    const { t } = useI18n();
    const ages = new Map();
    const sex = new Map();
    for (const r of audience.ageGender) {
        ages.set(r.age, (ages.get(r.age) ?? 0) + r.v);
        sex.set(r.gender, (sex.get(r.gender) ?? 0) + r.v);
    }
    const gender = (g) => (g === 'F' ? t('soc.women') : g === 'M' ? t('soc.men') : t('soc.otherG'));
    const blocks = [
        audience.countries.length > 0 && _jsx(Bars, { title: t('soc.countries'), rows: audience.countries.slice(0, 6) }, "c"),
        audience.cities.length > 0 && _jsx(Bars, { title: t('soc.cities'), rows: audience.cities.slice(0, 6) }, "ci"),
        ages.size > 0 && _jsx(Bars, { title: t('soc.ages'), rows: [...ages].sort((a, b) => a[0].localeCompare(b[0])).map(([name, n]) => ({ name, n })) }, "a"),
        sex.size > 0 && _jsx(Bars, { title: t('soc.gender'), rows: [...sex].map(([g, n]) => ({ name: gender(g), n })) }, "g"),
        ...['industry', 'function', 'seniority', 'companySize'].map((k) => (audience[k]?.length ?? 0) > 0 && _jsx(Bars, { title: t(`soc.a.${k}`), rows: audience[k].slice(0, 6) }, k)),
    ].filter(Boolean);
    if (!blocks.length)
        return null;
    return (_jsxs("div", { className: "card col g16", children: [_jsxs("div", { className: "col g4", children: [_jsx("h3", { className: "h3", children: t('soc.audience') }), _jsx("p", { className: "t-xs t-mute", children: t('soc.audienceSub') })] }), _jsx("div", { className: "grid gap-6 md:grid-cols-2", children: blocks })] }));
}
