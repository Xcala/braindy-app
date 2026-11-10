import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
export const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
/** Phones: the month as a small grid with a colored dot per item; tapping a day narrows the agenda below to it. */
export function MiniMonth({ days, month, dots, selected, onSelect }) {
    const { t, lang } = useI18n();
    const locale = lang === 'es' ? 'es-CO' : 'en-US';
    const today = dayKey(new Date());
    const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));
    return (_jsxs("div", { className: "cal-mini-wrap", children: [_jsxs("div", { className: "cal-mini", role: "grid", children: [weekdays.map((w, i) => _jsx("span", { className: "cal-mini-wd", role: "columnheader", children: w }, i)), days.map((d) => {
                        const k = dayKey(d);
                        const list = dots.get(k) ?? [];
                        const out = d.getMonth() !== month.getMonth();
                        return (_jsxs("button", { type: "button", role: "gridcell", disabled: !list.length, "aria-pressed": selected === k, className: `cal-mini-day${out ? ' is-out' : ''}${k === today ? ' is-today' : ''}${selected === k ? ' is-sel' : ''}`, "aria-label": `${d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}${list.length ? ` · ${list.length}` : ''}`, onClick: () => onSelect(selected === k ? null : k), children: [_jsx("span", { className: "cal-mini-num", children: d.getDate() }), _jsx("span", { className: "cal-mini-dots", children: list.slice(0, 3).map((c, i) => _jsx("i", { style: { background: c } }, i)) })] }, k));
                    })] }), selected && _jsx("button", { type: "button", className: "btn btn-ghost btn-sm self-start", onClick: () => onSelect(null), children: t('cal.allMonth') })] }));
}
