import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSearchParams } from 'react-router';
import { useI18n } from '../../i18n/I18nProvider';
import { WhatsappAccess } from '../../whatsapp/WhatsappAccess';
import { WhatsappInbox } from '../../whatsapp/WhatsappInbox';
import { WhatsappProfileCard } from '../../whatsapp/WhatsappProfileCard';
/**
 * Admin WhatsApp, in two zones that never mix: Braindy's own channel (status, unknown numbers, business profile),
 * which belongs to no brand, and who may use the channel in each brand.
 */
export function AdminWhatsapp() {
    const { t } = useI18n();
    const [params, setParams] = useSearchParams();
    const zone = params.get('zona') === 'marcas' ? 'brands' : 'channel';
    const pick = (z) => setParams(z === 'brands' ? { zona: 'marcas' } : {}, { replace: true });
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: t('waa.kicker') }), _jsxs("h1", { className: "h1", children: [_jsx("span", { className: "w9", children: "WhatsApp." }), " ", t('waa.tagline')] })] }), _jsxs("div", { className: "seg", role: "tablist", "aria-label": "WhatsApp", children: [_jsx("button", { role: "tab", "aria-selected": zone === 'channel', className: zone === 'channel' ? 'is-on' : '', onClick: () => pick('channel'), children: t('waa.zoneChannel') }), _jsx("button", { role: "tab", "aria-selected": zone === 'brands', className: zone === 'brands' ? 'is-on' : '', onClick: () => pick('brands'), children: t('waa.zoneBrands') })] }), zone === 'channel' ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('waa.channelHint') }), _jsxs("div", { className: "grid grid-cols-1 items-start gap-6 lg:grid-cols-2", children: [_jsx(WhatsappInbox, {}), _jsx(WhatsappProfileCard, {})] })] })) : _jsx(WhatsappAccess, {})] }));
}
