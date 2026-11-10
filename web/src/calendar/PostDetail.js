import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { askMoreHref } from '../report/askMore';
import { useI18n } from '../i18n/I18nProvider';
import { NetBadge, netInfo } from './PostBits';
export const TYPES = ['POST', 'REEL', 'STORY', 'CAROUSEL', 'SHORT', 'VIDEO'];
/** One post, view only: its media, copy, date, where it went out and, once out, its numbers next to it. */
export function PostDetail({ post, stat, onClose }) {
    const { t, lang } = useI18n();
    const close = useRef(null);
    useEffect(() => {
        close.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);
    const fmt = (v) => (v == null ? '—' : new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { maximumFractionDigits: 0 }).format(v));
    const nums = stat ? [['soc.k.views', stat.views], ['soc.k.reach', stat.reach], ['soc.k.interactions', stat.interactions], ['soc.t.saves', stat.saves], ['soc.t.shares', stat.shares]].filter(([, v]) => v != null) : [];
    const link = post.networks.find((n) => n.url)?.url ?? stat?.url ?? '';
    const when = post.date.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
    return (_jsx("div", { className: "scrim fixed inset-0 z-50 flex items-center justify-center p-4", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: _jsxs("div", { className: "modal cal-detail w-full max-w-[760px]", role: "dialog", "aria-modal": "true", "aria-labelledby": "cal-detail-title", children: [_jsx("div", { className: "cal-detail-media", children: post.media.length === 0 ? _jsx("div", { className: "cal-thumb is-text", children: "Aa" }) : post.media.map((m) => m.kind === 'video'
                        ? _jsx("video", { src: m.url, controls: true, playsInline: true, preload: "metadata" }, m.url)
                        : _jsx("img", { src: m.url, alt: "" }, m.url)) }), _jsxs("div", { className: "col g12 min-w-0", children: [_jsxs("div", { className: "row between g8", children: [_jsx("span", { className: `chip cal-st is-${post.status}`, children: t(`cal.st.${post.status}`) }), _jsx("button", { ref: close, type: "button", className: "btn btn-ghost btn-sm", onClick: onClose, "aria-label": t('lb.close'), children: "\u2715" })] }), _jsx("h2", { className: "h3", id: "cal-detail-title", style: { margin: 0 }, children: when }), _jsx("p", { className: "t-xs t-mute", style: { margin: 0 }, children: TYPES.includes(post.type) ? t(`cal.type.${post.type}`) : post.type }), post.title && _jsx("p", { className: "w7", style: { margin: 0 }, children: post.title }), post.text ? _jsx("p", { className: "t-sm cal-copy", children: post.text }) : _jsx("p", { className: "t-sm t-mute", children: t('cal.noCopy') }), nums.length > 0 && (_jsx("dl", { className: "cal-nums", children: nums.map(([k, v]) => _jsxs("div", { children: [_jsx("dt", { className: "t-xs t-mute", children: t(k) }), _jsx("dd", { className: "w7", children: fmt(v) })] }, k)) })), post.status === 'published' && (_jsx(Link, { className: "btn btn-secondary btn-sm self-start", to: askMoreHref(t('rp.moreText', { title: (post.title || post.text).slice(0, 120) }), link), onClick: onClose, children: t('rp.more') })), _jsx("ul", { className: "col g8 cal-nets", children: post.networks.map((n, i) => (_jsxs("li", { className: "row g8", children: [_jsx(NetBadge, { network: n.network }), _jsx("span", { className: "t-sm w7", children: netInfo(n.network).label }), _jsx("span", { className: `chip cal-st is-${n.status}`, children: t(`cal.st.${n.status}`) }), n.url && _jsxs("a", { className: "t-sm", href: n.url, target: "_blank", rel: "noreferrer", children: [t('cal.seePost'), " \u2197"] })] }, i))) })] })] }) }));
}
