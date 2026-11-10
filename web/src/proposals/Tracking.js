import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { fmtWhen } from './ActivityLine';
import { useEvents, useSends } from './useProposals';
import { SECTION_KEYS } from './types';
const minutes = (s) => (s < 60 ? `${s} s` : `${Math.round(s / 60)} min`);
const gap = (a, b) => {
    if (!a || !b)
        return '';
    const h = (b.getTime() - a.getTime()) / 3_600_000;
    return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} d`;
};
export function Tracking({ id }) {
    const { t } = useI18n();
    const sends = useSends(id);
    return (_jsxs("section", { className: "card col g20", "aria-labelledby": "ptrack", children: [_jsxs("div", { className: "row between", children: [_jsx("h2", { className: "h3", id: "ptrack", children: t('proposals.tracking') }), _jsx("span", { className: "t-sm t-mute", children: t('proposals.perSend') })] }), sends.length === 0 ? _jsx("p", { className: "t-sm t-mute", children: t('proposals.noSends') }) : sends.map((s) => _jsx(SendCard, { proposalId: id, send: s }, s.id))] }));
}
function SendCard({ proposalId, send }) {
    const { t, lang } = useI18n();
    const events = useEvents(proposalId, send.id);
    const sentAt = send.createdAt?.toDate();
    const opens = events.filter((e) => e.type === 'open');
    const section = (n) => t(`proposals.section.${SECTION_KEYS[Math.min(n, SECTION_KEYS.length - 1)]}`);
    return (_jsxs("div", { className: "col g12", style: { border: '1px solid var(--line)', borderRadius: 18, padding: 20 }, children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("span", { className: "row g8", children: [_jsx(Icon, { name: send.channel === 'link' ? 'link' : 'external' }), _jsx("span", { className: "w7", children: t(`proposals.sendTo.${send.channel}`, { to: send.to || '—' }) })] }), _jsx("span", { className: `chip ${send.opens ? 'c-sent' : 'c-draft'}`, children: t('proposals.opens', { n: send.opens }) })] }), _jsxs("div", { className: "tl", children: [_jsx(Item, { on: true, icon: "arrowLeft", title: t(`proposals.sentBy.${send.channel}`), meta: fmtWhen(sentAt, lang) }), opens.map((e, i) => (_jsx(Item, { ok: true, icon: "search", title: i === 0 ? t('proposals.openedAfter', { gap: gap(sentAt, e.at?.toDate()) }) : t('proposals.openedAgain'), meta: [fmtWhen(e.at?.toDate(), lang), e.seconds ? t('proposals.viewing', { time: minutes(e.seconds) }) : '', e.maxSection ? t('proposals.readTo', { section: section(e.maxSection) }) : '', e.device ? t(`proposals.device.${e.device}`) : ''].filter(Boolean).join(' · ') }, e.id))), events.filter((e) => e.type === 'accepted').map((e) => (_jsx(Item, { ok: true, icon: "check", title: t('proposals.acceptedBy', { name: e.name ?? '' }), meta: fmtWhen(e.at?.toDate(), lang) }, e.id))), !opens.length && _jsx(Item, { icon: "search", muted: true, title: t('proposals.notOpened'), meta: t('proposals.followUp') })] })] }));
}
function Item({ title, meta, icon, on, ok, muted }) {
    return (_jsxs("div", { className: "tl-item", children: [_jsx("span", { className: `tl-dot ${on ? 'on' : ok ? 'ok' : ''}`, children: _jsx(Icon, { name: icon, size: 14 }) }), _jsxs("div", { className: "col g4", children: [_jsx("span", { className: "w7", style: muted ? { color: 'var(--graphite)' } : undefined, children: title }), meta && _jsx("span", { className: "t-sm t-mute", children: meta })] })] }));
}
