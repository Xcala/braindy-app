import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../../i18n/I18nProvider';
/** Anexo 3: what the client hands over and in which week (due on Friday of that week). */
export function ChecklistEditor({ items, weeks, onChange }) {
    const { t } = useI18n();
    const set = (i, p) => onChange(items.map((x, k) => (k === i ? { ...x, ...p } : x)));
    return (_jsxs("div", { className: "col g8", children: [items.map((it, i) => (_jsxs("div", { className: "row g8", children: [_jsx("input", { className: "input", style: { flex: 1 }, value: it.title, "aria-label": t('ctr.k.item'), onChange: (e) => set(i, { title: e.target.value }) }), _jsx("select", { className: "input", style: { width: 90 }, value: it.week, "aria-label": t('ctr.k.week'), onChange: (e) => set(i, { week: Number(e.target.value) }), children: Array.from({ length: weeks }, (_, w) => _jsx("option", { value: w, children: t('ctr.weekShort', { n: w + 1 }) }, w)) }), _jsx("button", { className: "btn btn-ghost btn-sm", "aria-label": t('ctr.g.removeRow'), onClick: () => onChange(items.filter((_, k) => k !== i)), children: "\u00D7" })] }, it.id))), _jsx("button", { className: "btn btn-secondary btn-sm", style: { alignSelf: 'flex-start' }, onClick: () => onChange([...items, { id: `k${Date.now().toString(36)}`, title: '', week: 0, done: false }]), children: t('ctr.k.add') })] }));
}
