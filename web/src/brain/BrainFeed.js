import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { KIND_COLOR } from './BrainCanvas';
import { plainLine } from '../lib/scan';
/** One line for an event, in the reader's language (the Mi marca, meeting and session texts are composed here). */
export function eventText(e, t) {
    if (e.kind === 'identity' && e.parts?.includes('version'))
        return t('bb.txt.version', { text: e.text ?? '' });
    if (e.kind === 'identity')
        return t('bb.txt.identity', { parts: (e.parts ?? []).map((p) => t(`bb.part.${p}`)).join(', ') });
    if (e.kind === 'meeting')
        return t('bb.txt.meeting');
    if (e.kind === 'session')
        return e.text ? t('bb.txt.sessionOn', { text: e.text }) : t('bb.txt.session');
    if (e.kind === 'signed')
        return t('bb.txt.signed');
    if (e.kind === 'file' && (e.count ?? 1) > 1)
        return t('bb.txt.files', { n: e.count, text: e.text ?? '' });
    return e.text ?? '';
}
export function ago(d, t) {
    if (!d)
        return t('bb.never');
    const m = Math.max(0, Math.round((Date.now() - +d) / 60000));
    return m < 1 ? t('bb.now') : m < 60 ? t('bb.minAgo', { n: m }) : m < 1440 ? t('bb.hAgo', { n: Math.round(m / 60) }) : t('bb.dAgo', { n: Math.round(m / 1440) });
}
/** What it learned, newest first. Items that arrive while the page is open slide in and flash. */
export function BrainFeed({ events, fresh }) {
    const { t, lang } = useI18n();
    const day = (d) => d?.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) ?? '';
    return (_jsxs("section", { className: "card bb-feed col", "aria-labelledby": "h-bb-feed", children: [_jsxs("header", { className: "row between g8", style: { alignItems: 'flex-start' }, children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h3", id: "h-bb-feed", children: t('bb.learned') }), _jsx("p", { className: "t-sm t-mute", children: t('bb.learnedSub') })] }), _jsx("span", { className: "bb-live t-xs w7", children: t('bb.live') })] }), events.length === 0 && _jsx("p", { className: "t-sm t-mute", style: { padding: '8px 4px' }, children: t('bb.empty') }), _jsx("ul", { className: "bb-list", children: events.map((e) => {
                    const text = eventText(e, t);
                    return (_jsxs("li", { className: `bb-item${fresh.has(e.id) ? ' is-new' : ''}`, children: [_jsx("span", { className: "bb-chip", style: { ['--c']: KIND_COLOR[e.kind] }, children: t(`bb.kind.${e.kind}`) }), _jsxs("div", { className: "col g4 grow", children: [e.requestId ? _jsx(Link, { to: `/requests/${e.requestId}`, className: "t-sm bb-txt", children: _jsx(FeedText, { text: text }) }) : _jsx("span", { className: "t-sm bb-txt", children: _jsx(FeedText, { text: text }) }), _jsxs("span", { className: "t-xs t-mute", children: [_jsx("b", { className: "w7", children: t(`bb.area.${e.area}`) }), " \u00B7 ", day(e.at)] })] })] }, e.id));
                }) })] }));
}
/** An event in the feed: the request in bold, then the gist on up to three lines (no markdown, no line breaks). */
function FeedText({ text }) {
    const line = plainLine(text);
    const m = /^(.{2,90}?):\s+(.+)$/.exec(line);
    return m ? _jsxs(_Fragment, { children: [_jsx("strong", { className: "w7", children: m[1] }), _jsxs("span", { className: "bb-gist", children: [" \u00B7 ", m[2]] })] }) : _jsx(_Fragment, { children: line });
}
