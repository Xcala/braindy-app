import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { NICO_EMAIL, nicoPhone, nicoWhatsApp } from '../lib/nicoWhatsApp';
import { noticesApi } from '../review/api';
import { Icon, WhatsAppIcon } from '../components/Icon';
import { BookMeeting } from './BookMeeting';
const MailIcon = () => (_jsx("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M4 6h16v12H4zM4 7l8 6 8-6" }) }));
const CalIcon = () => (_jsx("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4" }) }));
const TextIcon = () => (_jsx("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M5 5h14v10H10l-4 4v-4H5zM9 10h6" }) }));
/**
 * "Contact Nick": one button, every way to reach him, plus booking 30 minutes in his calendar. The brand's WhatsApp group first (or, without one,
 * add it as admin / ask for it as a client), then his WhatsApp, email and text message.
 */
export function TalkToNico({ brandName }) {
    const { t } = useI18n();
    const { current } = useBrands();
    const admin = useAuth().profile?.role === 'admin';
    const [open, setOpen] = useState(false);
    const [booking, setBooking] = useState(false);
    const [group, setGroup] = useState(null);
    const box = useRef(null);
    useEffect(() => {
        setGroup(null);
        if (current)
            noticesApi.get(current.id).then((s) => setGroup((s.groups ?? []).find((g) => g.url)?.url ?? null)).catch(() => setGroup(null));
    }, [current?.id]);
    useEffect(() => {
        if (!open)
            return;
        const away = (e) => { if (!box.current?.contains(e.target))
            setOpen(false); };
        const esc = (e) => { if (e.key === 'Escape')
            setOpen(false); };
        document.addEventListener('mousedown', away);
        document.addEventListener('keydown', esc);
        return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
    }, [open]);
    const phone = nicoPhone(current);
    const close = () => setOpen(false);
    const ext = { target: '_blank', rel: 'noreferrer', onClick: close, role: 'menuitem', className: 'menu-item' };
    return (_jsxs("div", { ref: box, className: "relative", children: [_jsxs("button", { type: "button", className: "btn btn-primary", "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen((o) => !o), children: [t('home.talkNico'), _jsx(Icon, { name: "chevronDown", size: 16 })] }), open && (_jsxs("div", { className: "menu absolute left-0 top-[52px] z-40 flex w-[min(300px,calc(100vw-32px))] flex-col gap-0.5", role: "menu", "aria-label": t('home.talkNico'), children: [group
                        ? _jsxs("a", { href: group, ...ext, children: [_jsx("span", { className: "talk-ico is-wa", children: _jsx(WhatsAppIcon, {}) }), t('hg.group')] })
                        : admin
                            ? _jsxs(Link, { to: "/settings?tab=notices", onClick: close, role: "menuitem", className: "menu-item", children: [_jsx("span", { className: "talk-ico is-wa", children: _jsx(WhatsAppIcon, {}) }), t('hg.groupAdd')] })
                            : _jsxs("a", { href: nicoWhatsApp(current, t('hg.groupAskText', { brand: brandName })), ...ext, children: [_jsx("span", { className: "talk-ico is-wa", children: _jsx(WhatsAppIcon, {}) }), t('hg.groupAsk')] }), _jsxs("a", { href: nicoWhatsApp(current), ...ext, children: [_jsx("span", { className: "talk-ico is-wa", children: _jsx(WhatsAppIcon, {}) }), t('hg.waNico')] }), _jsxs("a", { href: `mailto:${NICO_EMAIL}?subject=${encodeURIComponent(`Braindy · ${brandName}`)}`, ...ext, target: undefined, children: [_jsx("span", { className: "talk-ico", children: _jsx(MailIcon, {}) }), _jsxs("span", { className: "col", children: [_jsx("span", { children: t('hg.emailNico') }), _jsx("span", { className: "t-xs t-mute", children: NICO_EMAIL })] })] }), _jsxs("a", { href: `sms:+${phone}`, ...ext, target: undefined, children: [_jsx("span", { className: "talk-ico", children: _jsx(TextIcon, {}) }), _jsxs("span", { className: "col", children: [_jsx("span", { children: t('hg.textNico') }), _jsxs("span", { className: "t-xs t-mute", children: ["+", phone] })] })] }), current && (_jsxs("button", { type: "button", role: "menuitem", className: "menu-item w-full text-left", style: { border: 0, background: undefined, cursor: 'pointer', borderTop: '1px solid var(--line)', borderRadius: 0, marginTop: 4, paddingTop: 10 }, onClick: () => { close(); setBooking(true); }, children: [_jsx("span", { className: "talk-ico is-cal", children: _jsx(CalIcon, {}) }), t('hg.book')] }))] })), booking && current && _jsx(BookMeeting, { brandId: current.id, onClose: () => setBooking(false) })] }));
}
