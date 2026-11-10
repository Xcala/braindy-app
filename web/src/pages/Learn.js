import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { AREAS, embedUrl, isVideoFile, useLessons } from '../criterio/useCriterio';
import { LessonTile } from '../criterio/LessonCards';
import { Prose } from '../criterio/Prose';
import { AREA_ART, LearnStage, LessonCover, LessonStage, sectionsOf } from '../criterio/LessonArt';
import { Explainer } from '../plan/Explainer';
import { TutorialShelf, isTutorial, videoOf } from '../learn/tutorials';
/** Learn: first "How to use Braindy" (the app videos), then "El Criterio de NicoMarca" / "NickMark Taste", every lesson by area. */
export function Learn() {
    const { t } = useI18n();
    const { list: all, loading } = useLessons();
    const list = all.filter((l) => !isTutorial(l));
    const [area, setArea] = useState('');
    const present = AREAS.filter((a) => list.some((l) => l.area === a));
    const shown = list.filter((l) => !area || l.area === area);
    return (_jsxs("div", { className: "col g24", children: [_jsx("h1", { className: "h1", children: _jsxs("span", { className: "w9", children: [t('cr.nav'), "."] }) }), _jsx(TutorialShelf, { list: all }), _jsxs("div", { className: "col g8", children: [_jsx("h2", { className: "h2", children: _jsx("span", { className: "w9", children: t('cr.taste') }) }), _jsx("p", { className: "t-sm t-mute", children: t('cr.sub') })] }), _jsx(Explainer, { label: t('cr.howLabel'), title: t('cr.howTitle'), strong: t('cr.howStrong'), lead: t('cr.howLead'), stage: _jsx(LearnStage, { label: { topic: t('cr.anTopic'), tip: t('cr.anTip'), ok: t('cr.anOk') } }), steps: [1, 2, 3, 4, 5].map((n) => [t(`cr.s${n}`), t(`cr.s${n}b`)]) }), present.length > 1 && (_jsxs("nav", { className: "seg seg-scroll", "aria-label": t('cra.f.area'), children: [_jsxs("button", { className: area === '' ? 'is-on' : '', "aria-pressed": area === '', onClick: () => setArea(''), children: [t('cr.all'), " \u00B7 ", list.length] }), present.map((a) => _jsxs("button", { className: area === a ? 'is-on' : '', "aria-pressed": area === a, onClick: () => setArea(a), children: [_jsx("span", { style: { color: AREA_ART[a].color }, children: AREA_ART[a].icon }), " ", t(`cr.area.${a}`)] }, a))] })), loading ? _jsx("div", { className: "skel", style: { height: 200 } })
                : shown.length === 0 ? _jsx("div", { className: "card t-mute", children: t('cr.empty') })
                    : _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: shown.map((l) => _jsx(LessonTile, { l: l }, l.id)) })] }));
}
/** One lesson: video (or "coming soon"), the written lesson, the presentation, and NickMark's signature. */
export function LearnLesson() {
    const { id } = useParams();
    const { t, lang } = useI18n();
    const { list, loading } = useLessons();
    const l = list.find((x) => x.id === id);
    if (loading)
        return _jsx("div", { className: "skel", style: { height: 320 } });
    if (!l)
        return _jsxs("div", { className: "card col g12", children: [_jsx("p", { className: "t-mute", children: t('cr.empty') }), _jsx(Link, { to: "/learn", className: "t-sm w7", children: t('cr.back') })] });
    const embed = embedUrl(l.videoUrl);
    const video = videoOf(l, lang);
    const related = list.filter((x) => (l.kind ? x.kind === l.kind : x.area === l.area && !x.kind) && x.id !== l.id).slice(0, 3);
    const sections = sectionsOf(l.body[lang]);
    const accent = AREA_ART[l.area].color;
    return (_jsxs("div", { className: "col g24", children: [_jsxs("nav", { className: "crumbs", "aria-label": "Breadcrumb", children: [_jsx(Link, { to: "/learn", children: t('cr.nav') }), _jsx(Icon, { name: "chevronRight", size: 14 }), _jsx("span", { className: "cur", children: l.kind ? t('tut.title') : t(`cr.area.${l.area}`) })] }), _jsx(LessonCover, { l: l, big: true, label: `${l.kind ? t(`tut.kind.${l.kind}`) : t(`cr.area.${l.area}`)} · ${t('cr.minutes', { n: l.minutes })}` }), _jsxs("div", { className: "col g8", style: { maxWidth: 820 }, children: [l.status === 'draft' && _jsx("span", { className: "chip c-draft self-start", children: t('cr.draft') }), _jsx("h1", { className: "h1", children: _jsx("span", { className: "w9", children: l.title[lang] }) }), _jsx("p", { className: "t-lg t-mute", children: l.summary[lang] })] }), sections.length >= 2 && (_jsx(Explainer, { label: t('cr.inThis'), title: "", strong: t('cr.keyIdeas', { n: Math.min(5, sections.length) }), stage: _jsx(LessonStage, { l: l, steps: sections }), steps: sections.slice(0, 5).map((s, i) => [s, t('cr.part', { n: i + 1 })]) })), video && isVideoFile(video.wide) ? (_jsxs("video", { controls: true, playsInline: true, preload: "metadata", title: l.title[lang], className: "w-full rounded-[20px]", style: { maxWidth: 960, background: '#05070D' }, children: [video.tall && _jsx("source", { src: video.tall, type: "video/mp4", media: "(max-width: 640px)" }), _jsx("source", { src: video.wide, type: "video/mp4" })] }, video.wide)) : embed ? (_jsx("div", { className: "overflow-hidden rounded-[20px]", style: { aspectRatio: '16 / 9', maxWidth: 960, background: '#05070D' }, children: _jsx("iframe", { src: embed, title: l.title[lang], className: "h-full w-full", allow: "autoplay; fullscreen; picture-in-picture", allowFullScreen: true, style: { border: 0 } }) })) : l.videoUrl ? _jsxs("a", { className: "btn btn-primary self-start", href: l.videoUrl, target: "_blank", rel: "noreferrer", children: ["\u25B6 ", t('cr.watch')] })
                : _jsx("p", { className: "t-sm t-mute", children: t('cr.videoSoon') }), _jsxs("div", { className: "row g12 wrap", style: { alignItems: 'center' }, children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-9 w-9 rounded-full object-cover" }), _jsx("span", { className: "t-sm w7", children: t('sig.card') }), l.deckUrl && _jsx("a", { className: "btn btn-secondary btn-sm", href: l.deckUrl, target: "_blank", rel: "noreferrer", children: t('cr.deck') })] }), sections.length >= 2 && (_jsx("nav", { className: "lx-toc", "aria-label": t('cr.inThis'), children: sections.map((s, i) => _jsxs("a", { href: `#sec-${i + 1}`, children: [_jsx("b", { style: { background: accent }, children: i + 1 }), s] }, s)) })), _jsx("article", { className: "card", style: { padding: 'clamp(20px, 4vw, 40px)' }, children: _jsx(Prose, { text: l.body[lang], accent: accent }) }), related.length > 0 && _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: related.map((x) => _jsx(LessonTile, { l: x }, x.id)) })] }));
}
