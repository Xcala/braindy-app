import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LessonCover } from './LessonArt';
import { lessonOfWeek, logObjection, matchObjection, pick, useLessons, useObjections } from './useCriterio';
/** A lesson as a card: an illustrated cover (area color, its Brain), then title, summary and minutes. */
export function LessonTile({ l, kicker }) {
    const { t, lang } = useI18n();
    return (_jsxs(Link, { to: `/learn/${l.id}`, className: "card lesson-card", children: [_jsx(LessonCover, { l: l, label: kicker ?? t(`cr.area.${l.area}`) }), _jsxs("div", { className: "lc-body", children: [_jsx("span", { className: "h3", children: l.title[lang] }), _jsx("span", { className: "t-sm t-mute line-clamp-3", children: l.summary[lang] }), _jsxs("span", { className: "row g8", style: { marginTop: 'auto' }, children: [_jsxs("span", { className: "chip chip-plain", children: [l.videoUrl ? '▶ ' : '', t('cr.minutes', { n: l.minutes })] }), l.status === 'draft' && _jsx("span", { className: "chip c-draft", children: t('cr.draft') })] })] })] }));
}
/** Home: one lesson per week. */
export function LessonOfTheWeek() {
    const { t } = useI18n();
    const l = lessonOfWeek(useLessons().list);
    if (!l)
        return null;
    return _jsx("div", { "data-tour": "home-lesson", children: _jsx(LessonTile, { l: l, kicker: `${t('cr.name')} · ${t('cr.weekly')}` }) });
}
/** Ask: how to ask well for this type of piece (or the general "how to ask" lesson). */
export function LessonForCategory({ category }) {
    const { t } = useI18n();
    const { list } = useLessons();
    const l = (category && pick(list, { category, stage: 'ask' })[0]) || pick(list, { stage: 'ask' }).find((x) => x.categories.length === 0);
    return l ? _jsx(LessonTile, { l: l, kicker: `${t('cr.name')} · ${t('cr.forAsk')}` }) : null;
}
/** Review screen: how this kind of piece is made, next to "why it works". */
export function LessonForRequest({ category }) {
    const { t } = useI18n();
    const { list } = useLessons();
    const l = category ? pick(list, { category, stage: 'review' })[0] : undefined;
    return l ? _jsx(LessonTile, { l: l, kicker: `${t('cr.name')} · ${t('cr.forThis')}` }) : null;
}
/** The typical objection a comment sounds like (published ones), or null. */
export function useObjectionMatch(text) {
    return matchObjection(text, useObjections().list);
}
/** Under the comment box: if the comment sounds like a typical objection, NickMark's short answer. Never blocks. */
export function ObjectionHint({ brandId, o }) {
    const { t, lang } = useI18n();
    const logged = useRef(null);
    useEffect(() => {
        if (o && logged.current !== o.id) {
            logged.current = o.id;
            logObjection(brandId, o.id, 'shown');
        }
    }, [o, brandId]);
    if (!o)
        return null;
    return (_jsxs("div", { className: "col g8", role: "note", style: { background: '#FFF8E6', borderRadius: 14, padding: 14 }, children: [_jsxs("span", { className: "row g8", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-6 w-6 rounded-full object-cover" }), _jsx("span", { className: "t-xs w7", children: t('cr.hintTitle') })] }), _jsxs("span", { className: "t-sm w7", children: ["\u00AB", o.phrase[lang], "\u00BB"] }), _jsx("span", { className: "t-sm", children: o.answer[lang] }), o.lessonId && _jsx(Link, { to: `/learn/${o.lessonId}`, className: "t-sm w7", onClick: () => logObjection(brandId, o.id, 'opened'), children: t('cr.hintSee') }), _jsx("span", { className: "t-xs t-mute", children: t('cr.hintSend') })] }));
}
/** Onboarding: the few lessons that put us on the same page before the first piece. */
export function OnboardingLessons() {
    const { t } = useI18n();
    const list = pick(useLessons().list, { stage: 'onboarding' }).slice(0, 5);
    if (!list.length)
        return null;
    return (_jsxs("section", { className: "col g12", "aria-labelledby": "h-ob-lessons", children: [_jsxs("div", { className: "col g4", children: [_jsx("p", { className: "label", children: t('cr.name') }), _jsx("h2", { className: "h3", id: "h-ob-lessons", children: t('cr.onboardingTitle') }), _jsx("span", { className: "t-sm t-mute", children: t('cr.onboardingSub') })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2", children: list.map((l) => _jsx(LessonTile, { l: l }, l.id)) })] }));
}
