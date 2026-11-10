import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { AppLogo } from './AppLogo';
import { DragHandle, LinkCell, PasswordCell, PlanCell, UserCell } from './AccessBits';
import { useSubline } from './AccessRow';
/** The same app as a card, for the grid view. */
export function AccessCard({ brandId, a, logo, drag, onEdit }) {
    const { t } = useI18n();
    const sub = useSubline(a);
    return (_jsxs("article", { className: `card acc-card col g12${drag.className}`, ...drag.bind, children: [_jsxs("div", { className: "row g12 min-w-0", children: [_jsx(AppLogo, { name: a.platform, domain: logo, size: 40 }), _jsxs("span", { className: "col min-w-0 grow", children: [_jsx("span", { className: "w7 truncate", children: a.platform }), _jsx("span", { className: "t-xs t-mute truncate", children: sub })] }), drag.enabled && _jsx(DragHandle, { label: t('apps.move', { name: a.platform }), onMove: drag.move })] }), _jsxs("dl", { className: "acc-card-fields", children: [_jsx("dt", { children: t('acc.user') }), _jsx("dd", { children: _jsx(UserCell, { a: a }) }), _jsx("dt", { children: t('acc.password') }), _jsx("dd", { children: _jsx(PasswordCell, { brandId: brandId, a: a, onEdit: onEdit }) }), _jsx("dt", { children: t('acc.link') }), _jsx("dd", { children: _jsx(LinkCell, { a: a }) }), a.subscription && _jsxs(_Fragment, { children: [_jsx("dt", { children: t('acc.subscription') }), _jsx("dd", { children: _jsx(PlanCell, { a: a }) })] })] }), _jsxs("div", { className: "row between g8 acc-card-foot", children: [a.group ? _jsx("span", { className: "chip", children: a.group }) : _jsx("span", {}), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onEdit, "aria-label": `${t('acc.edit')} · ${a.platform}`, children: t('acc.edit') })] })] }));
}
