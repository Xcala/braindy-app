import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { NoticesCard } from '../settings/NoticesCard';
import { MyWhatsappCard } from '../settings/MyWhatsappCard';
import { MembersCard } from '../team/MembersCard';
import { BillingCard } from '../settings/BillingCard';
import { BackToAccount } from './Account';
const TABS = [['notices', 'set.tab.notices'], ['team', 'set.tab.team'], ['language', 'set.tab.language'], ['billing', 'set.tab.billing']];
/** Settings: WhatsApp and notices, team and approvers, language, billing. Per brand, in tabs like the other pages. */
export function Settings() {
    const { current } = useBrands();
    const isAdmin = useAuth().profile?.role === 'admin';
    // NickMark manages people in Team (admin), the one place for it; clients keep it here.
    const tabs = isAdmin ? TABS.filter(([k]) => k !== 'team') : TABS;
    const { t } = useI18n();
    const [params, setParams] = useSearchParams();
    if (isAdmin && params.get('tab') === 'team')
        return _jsx(Navigate, { to: "/team", replace: true });
    const tab = tabs.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'notices';
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    // Same pattern as the rest of the app: title on top, a row of tabs, one section at a time.
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx(BackToAccount, {}), _jsx("p", { className: "label", children: current.name }), _jsx("h1", { className: "h1", children: t('nav.settings') })] }), _jsx("nav", { className: "seg seg-scroll", "aria-label": t('nav.settings'), children: tabs.map(([k, label]) => (_jsx("button", { type: "button", onClick: () => setParams({ tab: k }, { replace: true }), "aria-pressed": tab === k, className: tab === k ? 'is-on' : '', children: t(label) }, k))) }), tab === 'notices' && _jsx("p", { className: "t-mute", style: { margin: 0 }, children: t('set.noticesTagline') }), tab === 'notices' && _jsx(MyWhatsappCard, {}), tab === 'notices' && _jsx(NoticesCard, { brandId: current.id }), tab === 'team' && _jsx(MembersCard, { brandId: current.id, brandName: current.name }), tab === 'language' && (_jsxs("div", { className: "card row between g16 wrap", children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7", children: t('set.tab.language') }), _jsx("span", { className: "t-sm t-mute", children: t('set.langSub') })] }), _jsx(LangToggle, {})] })), tab === 'billing' && _jsx(BillingCard, { brandId: current.id })] }));
}
