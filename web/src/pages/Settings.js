import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { NoticesCard } from '../settings/NoticesCard';
import { MembersCard } from '../team/MembersCard';
import { BillingCard } from '../settings/BillingCard';
const TABS = [['notices', 'set.tab.notices'], ['team', 'set.tab.team'], ['language', 'set.tab.language'], ['billing', 'set.tab.billing']];
/** Settings (design 20): WhatsApp and notices, team and approvers, language, billing. Per brand. */
export function Settings() {
    const { current } = useBrands();
    const { t } = useI18n();
    const [params, setParams] = useSearchParams();
    const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'notices';
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    return (_jsxs("div", { className: "grid grid-cols-1 items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]", children: [_jsxs("nav", { className: "col g4", "aria-label": t('nav.settings'), children: [_jsx("p", { className: "label", style: { padding: '0 12px 8px' }, children: current.name }), TABS.map(([k, label]) => (_jsx("button", { onClick: () => setParams({ tab: k }), "aria-current": tab === k ? 'page' : undefined, className: `menu-item text-left ${tab === k ? 'is-on' : ''}`, style: { border: 0, cursor: 'pointer', background: tab === k ? 'var(--niebla)' : 'none' }, children: t(label) }, k)))] }), _jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("h1", { className: "h1", children: t('nav.settings') }), tab === 'notices' && _jsx("p", { className: "t-mute", children: t('set.noticesTagline') })] }), tab === 'notices' && _jsx(NoticesCard, { brandId: current.id }), tab === 'team' && _jsx(MembersCard, { brandId: current.id, brandName: current.name }), tab === 'language' && (_jsxs("div", { className: "card row between g16 wrap", children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7", children: t('set.tab.language') }), _jsx("span", { className: "t-sm t-mute", children: t('set.langSub') })] }), _jsx(LangToggle, {})] })), tab === 'billing' && _jsx(BillingCard, { brandId: current.id })] })] }));
}
