import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
/** Step 6 (design 17): for two weeks after going live, Home opens with "your brand system is live". */
export function LiveBanner({ liveAt }) {
    const { t } = useI18n();
    if (!liveAt || Date.now() - liveAt.getTime() > 14 * 864e5)
        return null;
    return (_jsxs("section", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", "aria-labelledby": "h-live", children: [_jsx("p", { className: "label", children: t('home.liveKicker') }), _jsxs("h1", { className: "d-lg", id: "h-live", style: { color: '#fff' }, children: [_jsx("span", { className: "w9", children: t('home.live1') }), " ", t('home.live2')] }), _jsx("p", { className: "t-lg muted", children: t('home.liveSub') })] }));
}
