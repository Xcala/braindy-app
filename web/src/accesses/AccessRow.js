import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { AppLogo } from './AppLogo';
import { DragHandle, LinkCell, PasswordCell, PlanCell, UserCell } from './AccessBits';
export { priceLabel } from './AccessBits';
export const ALL_COLS = ['user', 'password', 'link', 'plan', 'notes'];
const WIDTH = { user: 'minmax(0,1fr)', password: 'minmax(0,1.3fr)', link: 'minmax(0,0.9fr)', plan: 'minmax(0,0.9fr)', notes: 'minmax(0,1fr)' };
export const COL_LABEL = { user: 'acc.user', password: 'acc.password', link: 'acc.link', plan: 'acc.subscription', notes: 'acc.notes' };
/** Grid template for the visible columns: platform first, the edit action last. */
export const gridFor = (cols) => ['minmax(0,1fr)', ...cols.map((c) => WIDTH[c]), '84px'].join(' ');
/** The line under the app's name: shared with Braindy, or when and who changed it last. */
export function useSubline(a) {
    const { t, lang } = useI18n();
    const date = a.updatedAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
    return a.sharedWithBraindy ? t('acc.shared') : [date, a.updatedByName].filter(Boolean).join(' · ');
}
/** App row: each visible column copies on its own; the password reveals in place for 30 s (logged). */
export function AccessRow({ brandId, a, cols, logo, drag, onEdit }) {
    const { t } = useI18n();
    const sub = useSubline(a);
    const cell = {
        user: _jsx(UserCell, { a: a }),
        password: _jsx(PasswordCell, { brandId: brandId, a: a, onEdit: onEdit }),
        link: _jsx(LinkCell, { a: a }),
        plan: _jsx(PlanCell, { a: a }),
        notes: _jsx("span", { className: "t-sm t-mute truncate", title: a.notes, children: a.notes || '—' }),
    };
    return (_jsxs("div", { className: `trow acc-row${drag.className}`, ...drag.bind, style: { gridTemplateColumns: gridFor(cols), minHeight: 64, minWidth: 260 + cols.length * 170 }, children: [_jsxs("span", { className: "row g12 min-w-0", children: [drag.enabled && _jsx(DragHandle, { label: t('apps.move', { name: a.platform }), onMove: drag.move }), _jsx(AppLogo, { name: a.platform, domain: logo }), _jsxs("span", { className: "col min-w-0", children: [_jsx("span", { className: "w7 truncate", children: a.platform }), _jsx("span", { className: "t-xs t-mute truncate", children: sub })] })] }), cols.map((c) => _jsx("div", { className: "acc-cell min-w-0", "data-label": t(COL_LABEL[c]), children: cell[c] }, c)), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm justify-self-end", onClick: onEdit, "aria-label": `${t('acc.edit')} · ${a.platform}`, children: t('acc.edit') })] }));
}
