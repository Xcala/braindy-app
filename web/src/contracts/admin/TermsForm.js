import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../../i18n/I18nProvider';
import { TERM_GROUPS } from '../types';
const LONG = new Set(['objeto', 'terceros.incluidos']);
/** The contract terms, grouped, minus the ones the main form already asks (hide). Labels say what each value means. */
export function TermsForm({ terms, onChange, missing, hide = [] }) {
    const { t } = useI18n();
    return (_jsx("div", { className: "col g16", children: TERM_GROUPS.map((g) => (_jsxs("fieldset", { className: "col g8", style: { border: 0, padding: 0, margin: 0 }, children: [_jsx("legend", { className: "label", style: { marginBottom: 6 }, children: t(`ctr.tg.${g.title}`) }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: g.keys.filter((k) => !hide.includes(k)).map((k) => (_jsxs("label", { className: `col g4 t-sm ${LONG.has(k) ? 'sm:col-span-2' : ''}`, children: [_jsx("span", { className: "w7", children: t(`ctr.t.${k}`) }), k === 'valor.moneda'
                                ? _jsxs("select", { className: "input", value: terms[k] ?? 'COP', onChange: (e) => onChange({ ...terms, [k]: e.target.value }), children: [_jsx("option", { children: "COP" }), _jsx("option", { children: "USD" })] })
                                : LONG.has(k)
                                    ? _jsx("textarea", { className: "input", rows: 2, value: terms[k] ?? '', onChange: (e) => onChange({ ...terms, [k]: e.target.value }) })
                                    : _jsx("input", { className: "input", value: terms[k] ?? '', onChange: (e) => onChange({ ...terms, [k]: e.target.value }), "aria-invalid": missing.includes(k) || undefined, style: missing.includes(k) ? { borderColor: 'var(--danger)' } : undefined })] }, k))) })] }, g.title))) }));
}
