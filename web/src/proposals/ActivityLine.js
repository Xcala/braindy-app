import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
export const fmtWhen = (d, lang) => d ? d.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
export function ActivityLine({ activity }) {
    const { t, lang } = useI18n();
    if (!activity)
        return _jsx("span", { className: "t-sm t-mute", children: "\u2014" });
    const when = fmtWhen(activity.at?.toDate(), lang);
    const what = t(`proposals.activity.${activity.type}`, { channel: activity.channel ? t(`proposals.channel.${activity.channel}`) : '', to: activity.to ?? '', name: activity.name ?? '' });
    const strong = ['opened', 'reopened', 'accepted'].includes(activity.type);
    return (_jsxs("span", { className: "t-sm truncate", children: [strong ? _jsx("strong", { children: what }) : _jsx("span", { className: "t-mute", children: what }), " ", when && _jsxs("span", { className: "t-mute", children: ["\u00B7 ", when] })] }));
}
