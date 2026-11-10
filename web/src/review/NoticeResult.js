import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
/** What happened with the review link after a delivery: sent, or a WhatsApp link for Nicolas to send. */
export function NoticeResult({ notice }) {
    const { t } = useI18n();
    if (notice.status === 'sent')
        return _jsx("p", { className: "t-sm", role: "status", style: { color: 'var(--success)' }, children: t('rev.sent') });
    if (notice.status === 'manual' && notice.waUrl)
        return (_jsxs("div", { className: "row g12 wrap", role: "status", children: [_jsx("span", { className: "t-sm", children: t('rev.manual') }), _jsx("a", { className: "btn btn-secondary btn-sm", href: notice.waUrl, target: "_blank", rel: "noreferrer", children: t('rev.openWhatsapp') })] }));
    if (notice.status === 'no_number')
        return _jsxs("p", { className: "t-sm t-mute", role: "status", children: [t('rev.noNumber'), " ", _jsx(Link, { to: "/settings", className: "w7", children: t('nav.settings') })] });
    if (notice.status === 'off')
        return _jsx("p", { className: "t-sm t-mute", role: "status", children: t('rev.off') });
    return _jsx("p", { className: "t-sm", role: "status", style: { color: 'var(--danger)' }, children: t('rev.error') });
}
