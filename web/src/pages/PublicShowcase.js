import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LangToggle } from '../i18n/LangToggle';
import { publicShareApi } from '../share/api';
import '../share/share.css';
/** Showcase (idea from Air): the work a brand approved, read-only, to show it to a boss or partners. No login. */
export function PublicShowcase() {
    const { token = '' } = useParams();
    const { t, lang } = useI18n();
    const [data, setData] = useState(null);
    const [gone, setGone] = useState(false);
    useEffect(() => { publicShareApi.showcase(token).then(setData, () => setGone(true)); }, [token]);
    const day = (iso) => (iso ? new Date(iso).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
    return (_jsxs("div", { className: "pub-page", children: [_jsxs("header", { className: "row between g12 pub-head", children: [_jsx("img", { src: "/brand/braindy-logo.svg", alt: "Braindy", style: { height: 24 } }), _jsx(LangToggle, {})] }), _jsx("main", { className: "pub-main is-wide", children: gone ? _jsx("div", { className: "card", children: _jsx("p", { className: "h3", children: t('sh.gone') }) }) : !data ? _jsx("div", { className: "skel", style: { height: 420 } }) : (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "row g12", children: [data.brand.logoUrl && _jsx("img", { src: data.brand.logoUrl, alt: "", className: "pub-logo" }), _jsxs("div", { className: "col g4", children: [_jsx("h1", { className: "h1", style: { margin: 0 }, children: _jsx("span", { className: "w9", children: data.brand.name }) }), _jsx("p", { className: "t-mute", style: { margin: 0 }, children: t('sh.pageLead') })] })] }), data.items.length === 0 && _jsx("p", { className: "t-mute", children: t('sh.empty') }), _jsx("div", { className: "sh-grid", children: data.items.map((it) => {
                                const [first, ...rest] = it.files;
                                return (_jsxs("article", { className: "card sh-card", children: [_jsx("div", { className: "sh-media", children: first.contentType.startsWith('video/') ? _jsx("video", { src: first.url, controls: true, preload: "metadata" })
                                                : first.contentType === 'application/pdf' ? _jsx("iframe", { src: first.url, title: first.name })
                                                    : _jsx("img", { src: first.url, alt: first.name, loading: "lazy" }) }), rest.some((f) => f.contentType.startsWith('image/')) && (_jsx("div", { className: "sh-thumbs", children: rest.filter((f) => f.contentType.startsWith('image/')).slice(0, 4).map((f) => _jsx("a", { href: f.url, target: "_blank", rel: "noreferrer", children: _jsx("img", { src: f.url, alt: f.name, loading: "lazy" }) }, f.url)) })), _jsxs("div", { className: "col g4", style: { padding: '14px 16px' }, children: [_jsx("h2", { className: "h3", style: { margin: 0 }, children: it.title }), _jsx("span", { className: "t-xs t-mute", children: [day(it.approvedAt) && t('sh.approvedOn', { date: day(it.approvedAt) }), it.total > 1 && t('sh.files', { n: it.total })].filter(Boolean).join(' · ') })] })] }, it.id));
                            }) }), _jsx("p", { className: "t-sm t-mute", children: t('sh.madeBy') })] })) })] }));
}
