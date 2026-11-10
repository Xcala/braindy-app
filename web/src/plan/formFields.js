import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
/** Small building blocks for the admin plan forms: a labelled field, text, number, date, chips and one-per-line lists. */
export function F({ label, wide, group, children }) {
    const cls = `pf-f${wide ? ' is-wide' : ''}`;
    // Groups of buttons are not wrapped in a label: a click on the label text would press the first one.
    return group ? _jsxs("div", { className: cls, role: "group", "aria-label": label, children: [_jsx("span", { children: label }), children] }) : _jsxs("label", { className: cls, children: [_jsx("span", { children: label }), children] });
}
export function Txt({ value, set, ph }) {
    return _jsx("input", { className: "input", value: value ?? '', placeholder: ph, onChange: (e) => set(e.target.value) });
}
export function Area({ value, set, rows = 2 }) {
    return _jsx("textarea", { className: "input pf-area", rows: rows, value: value ?? '', onChange: (e) => set(e.target.value) });
}
/** Whole numbers shown with thousands separators (prices in COP run long). */
export function Num({ value, set }) {
    const { lang } = useI18n();
    return (_jsx("input", { className: "input", inputMode: "numeric", value: value == null ? '' : value.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US'), onChange: (e) => { const d = e.target.value.replace(/\D/g, ''); set(d ? Number(d) : undefined); } }));
}
export function DateF({ value, set }) {
    return _jsx("input", { className: "input", type: "date", value: value ?? '', onChange: (e) => set(e.target.value || undefined) });
}
export function Chips({ value, set, options }) {
    return (_jsx("div", { className: "seg seg-scroll", role: "group", children: options.map(([v, l]) => _jsx("button", { type: "button", className: value === v ? 'is-on' : '', "aria-pressed": value === v, onClick: () => set(v), children: l }, v)) }));
}
/** A list of short texts, one per line. Empty lines are kept while typing and dropped on save. */
export function Lines({ value, set }) {
    return _jsx("textarea", { className: "input pf-area", rows: Math.max(3, value.length + 1), value: value.join('\n'), onChange: (e) => set(e.target.value.split('\n')) });
}
export function Item({ title, onRemove, children }) {
    const { t } = useI18n();
    return (_jsxs("div", { className: "pf-item", children: [_jsxs("div", { className: "pf-ihead", children: [_jsx("b", { children: title }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onRemove, children: t('pf.remove') })] }), children] }));
}
export function AddBtn({ label, onClick }) {
    return _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm pf-add", onClick: onClick, children: ["+ ", label] });
}
export function Sec({ title, children }) {
    return _jsxs("fieldset", { className: "pf-sec", children: [_jsx("legend", { children: title }), children] });
}
/** Drops empty lines and blank optional texts before saving. */
export function tidy(v) {
    if (Array.isArray(v))
        return v.filter((x) => !(typeof x === 'string' && !x.trim())).map(tidy);
    if (v && typeof v === 'object')
        return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== '' && x !== undefined).map(([k, x]) => [k, tidy(x)]));
    return (typeof v === 'string' ? v.trim() : v);
}
