import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import { dateLabel } from '../../lib/dates';
import { useSocialPosts } from '../../calendar/useSocialPosts';
import { INTENTS, ideasFor, intentForCategory } from './intents';
import { BrainKnows } from '../../brain/BrainLearned';
/**
 * First step of "New request": no blank box. Five intents to tap, up to three ideas made from the brand's own
 * calendar and season, and the last delivered pieces to ask for again. "Write it directly" skips all of it.
 */
export function AskStart({ brandId, list, onPick }) {
    const { t, lang } = useI18n();
    const [from, to, now] = useMemo(() => { const n = new Date(); return [new Date(+n - 60 * 864e5), new Date(+n + 14 * 864e5), n]; }, []);
    const { posts } = useSocialPosts(brandId, from, to);
    const ideas = ideasFor({ now, lang, postedRecently: posts.filter((p) => p.date < now).length, scheduledSoon: posts.filter((p) => p.date >= now).length });
    const delivered = list.filter((r) => (r.status === 'approved' || r.status === 'published') && !r.archived)
        .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0))
        .filter((r, i, all) => all.findIndex((x) => x.title === r.title) === i).slice(0, 3);
    const repeat = (r) => onPick({
        intent: intentForCategory(r.category), answers: {}, category: r.category, sub: r.subcategory, formatType: r.formatType,
        text: t('as.repeatText', { title: r.title }), links: [`${window.location.origin}/requests/${r.id}`],
    });
    return (_jsxs("div", { className: "col g24", children: [_jsx(BrainKnows, { brandId: brandId }), _jsxs("div", { className: "col g12", "data-tour": "ask-what", children: [_jsx("p", { className: "label", style: { margin: 0 }, children: t('as.intentsLabel') }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: INTENTS.map((i) => (_jsxs("button", { type: "button", className: "ask-intent", onClick: () => onPick({ intent: i.id, answers: {}, text: '' }), children: [_jsx("span", { className: "ask-intent-ico", children: _jsx(Icon, { name: i.icon }) }), _jsxs("span", { className: "col min-w-0", children: [_jsx("span", { className: "w7", children: i.label[lang] }), _jsx("span", { className: "t-xs t-mute", children: i.sub[lang] })] })] }, i.id))) })] }), _jsxs("div", { className: "col g12", children: [_jsx("p", { className: "label", style: { margin: 0 }, children: t('as.ideasLabel') }), ideas.map((d) => (_jsxs("button", { type: "button", className: "ask-idea", onClick: () => onPick({ intent: d.intent, answers: d.answers, text: d.text[lang] }), children: [_jsx(Icon, { name: "spark", size: 16 }), _jsxs("span", { className: "col grow min-w-0", children: [_jsx("span", { className: "t-sm w7", children: d.title[lang] }), _jsx("span", { className: "t-xs t-mute", children: d.sub[lang] })] }), _jsx(Icon, { name: "chevronRight", size: 16 })] }, d.id)))] }), delivered.length > 0 && (_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", style: { margin: 0 }, children: t('as.repeatLabel') }), delivered.map((r) => (_jsxs("button", { type: "button", className: "ask-idea", onClick: () => repeat(r), children: [_jsx(Icon, { name: "repeat", size: 16 }), _jsxs("span", { className: "col grow min-w-0", children: [_jsx("span", { className: "t-sm w7 truncate", children: r.title }), _jsx("span", { className: "t-xs t-mute", children: t('rr.deliveredOn', { day: dateLabel((r.approvedAt ?? r.updatedAt)?.toDate(), lang) }) })] }), _jsx("span", { className: "t-xs w7", style: { color: 'var(--azul)' }, children: t('as.repeat') })] }, r.id)))] })), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm self-start", onClick: () => onPick({ intent: '', answers: {}, text: '' }), children: t('as.direct') })] }));
}
