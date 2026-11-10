import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// "How to use Braindy": the app's own tutorial videos, apart from NickMark Taste. One overview, one short video per
// section and one per new feature, so an improvement re-records a small piece instead of the whole tour.
import { Link, useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { LessonTile } from '../criterio/LessonCards';
import { useLessons } from '../criterio/useCriterio';
const KINDS = ['general', 'section', 'feature'];
/** The video of a lesson in this language (falls back to Spanish, then to the single videoUrl). */
export function videoOf(l, lang) {
    const v = l.videos?.[lang] ?? l.videos?.es;
    return v ?? (l.videoUrl ? { wide: l.videoUrl, tall: l.videoVertical } : null);
}
export const isTutorial = (l) => !!l.kind;
/** Learn, on top: the overview, then the sections, then what's new. */
export function TutorialShelf({ list }) {
    const { t } = useI18n();
    const tuts = list.filter(isTutorial);
    if (!tuts.length)
        return null;
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "how-braindy", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { id: "how-braindy", className: "h2", children: _jsx("span", { className: "w9", children: t('tut.title') }) }), _jsx("p", { className: "t-sm t-mute", children: t('tut.sub') })] }), KINDS.map((k) => {
                const items = tuts.filter((l) => l.kind === k);
                if (!items.length)
                    return null;
                return (_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: t(`tut.kind.${k}`) }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: items.map((l) => _jsx(LessonTile, { l: l, kicker: t(`tut.kind.${k}`) }, l.id)) })] }, k));
            })] }));
}
/** On each client page: "▶ How it works", when that section has its video. */
export function HowItWorks() {
    const { pathname } = useLocation();
    const { t, lang } = useI18n();
    const { list } = useLessons();
    // The most specific page wins ("/brand/brain" over "/brand"); "/requests/*" means only the pages under it.
    const score = (p) => (p.endsWith('/*') ? (pathname.startsWith(p.slice(0, -1)) ? p.length : 0)
        : pathname === p || pathname.startsWith(`${p}/`) ? p.length : 0);
    const best = (x) => Math.max(0, ...(x.paths ?? []).map(score));
    const l = list.filter((x) => x.kind === 'section' && x.status === 'published' && best(x) > 0).sort((a, b) => best(b) - best(a))[0];
    if (!l || pathname.startsWith('/learn'))
        return null;
    return (_jsx("div", { className: "row", style: { justifyContent: 'flex-end', marginBottom: 8 }, children: _jsxs(Link, { to: `/learn/${l.id}`, className: "chip chip-plain t-sm", title: l.title[lang], children: ["\u25B6 ", t('tut.how'), " \u00B7 ", t('cr.minutes', { n: l.minutes })] }) }));
}
