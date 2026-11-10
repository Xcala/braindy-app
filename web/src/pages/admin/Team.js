import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { MembersCard } from '../../team/MembersCard';
/** Admin Team: the people of the brand picked in the top bar (access, approvers, invites). Cross-brand work lives in Today and Studio. */
export function AdminTeam() {
    const { t } = useI18n();
    const { current } = useBrands();
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: current.name }), _jsx("h1", { className: "h1", children: t('nav.team') })] }), _jsx(MembersCard, { brandId: current.id, brandName: current.name }, current.id), _jsx("p", { className: "t-xs t-mute", children: t('team.membersHint') })] }));
}
