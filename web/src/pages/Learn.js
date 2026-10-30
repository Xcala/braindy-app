import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { AREAS, embedUrl, useLessons } from '../criterio/useCriterio';
import { LessonTile } from '../criterio/LessonCards';
import { Prose } from '../criterio/Prose';
/** Learn: "El Criterio de NicoMarca" / "NickMark Taste", every lesson by area. */
export function Learn() {
    const { t } = useI18n();
    const { list, loading } = useLessons();
    const [area, setArea] = useState('');
    const present = AREAS.filter((a) => list.some((l) => l.area === a));
    const shown = list.filter((l) => !area || l.area === area);
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: t('cr.name') }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('cr.nav'), "."] }), " ", t('cr.sub')] })] }), present.length > 1 && (_jsxs("div", { className: "row g8 wrap", role: "group", "aria-label": t('cra.f.area'), children: [_jsx("button", { className: `btn btn-sm ${area === '' ? 'btn-primary' : 'btn-secondary'}`, "aria-pressed": area === '', onClick: () => setArea(''), children: t('cr.all') }), present.map((a) => _jsx("button", { className: `btn btn-sm ${area === a ? 'btn-primary' : 'btn-secondary'}`, "aria-pressed": area === a, onClick: () => setArea(a), children: t(`cr.area.${a}`) }, a))] })), loading ? _jsx("div", { className: "skel", style: { height: 200 } })
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
    const related = list.filter((x) => x.area === l.area && x.id !== l.id).slice(0, 3);
    return (_jsxs("div", { className: "col g24", children: [_jsxs("nav", { className: "crumbs", "aria-label": "Breadcrumb", children: [_jsx(Link, { to: "/learn", children: t('cr.nav') }), _jsx(Icon, { name: "chevronRight", size: 14 }), _jsx("span", { className: "cur", children: t(`cr.area.${l.area}`) })] }), _jsxs("div", { className: "col g8", style: { maxWidth: 820 }, children: [_jsxs("div", { className: "row g8", children: [l.status === 'draft' && _jsx("span", { className: "chip c-draft", children: t('cr.draft') }), _jsx("span", { className: "chip chip-plain", children: t('cr.minutes', { n: l.minutes }) })] }), _jsx("h1", { className: "h1", children: _jsx("span", { className: "w9", children: l.title[lang] }) }), _jsx("p", { className: "t-lg t-mute", children: l.summary[lang] })] }), embed ? (_jsx("div", { className: "overflow-hidden rounded-[20px]", style: { aspectRatio: '16 / 9', maxWidth: 960, background: '#05070D' }, children: _jsx("iframe", { src: embed, title: l.title[lang], className: "h-full w-full", allow: "autoplay; fullscreen; picture-in-picture", allowFullScreen: true, style: { border: 0 } }) })) : l.videoUrl ? _jsxs("a", { className: "btn btn-primary self-start", href: l.videoUrl, target: "_blank", rel: "noreferrer", children: ["\u25B6 ", t('cr.watch')] })
                : _jsx("p", { className: "t-sm t-mute", children: t('cr.videoSoon') }), _jsxs("div", { className: "row g12 wrap", style: { alignItems: 'center' }, children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-9 w-9 rounded-full object-cover" }), _jsx("span", { className: "t-sm w7", children: t('sig.card') }), l.deckUrl && _jsx("a", { className: "btn btn-secondary btn-sm", href: l.deckUrl, target: "_blank", rel: "noreferrer", children: t('cr.deck') })] }), _jsx("article", { className: "card", style: { padding: 'clamp(20px, 4vw, 40px)' }, children: _jsx(Prose, { text: l.body[lang] }) }), related.length > 0 && _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: related.map((x) => _jsx(LessonTile, { l: x }, x.id)) })] }));
}
