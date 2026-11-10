import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { HomeStudio } from './HomeStudio';
import { TalkToNico } from './TalkToNico';
/**
 * Home hero: the studio is the screen. Above it, one line (date + what needs you, or "anything is possible")
 * and "Talk to Nick" with every way to reach him. The studio already shows him and his Brains, so the hero
 * repeats neither.
 */
export function HomeHero({ brandName, needsYou, open }) {
    const { t, lang } = useI18n();
    const today = new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "h-home", children: [_jsxs("div", { className: "row between g16 wrap", "data-tour": "home-needs", children: [_jsxs("div", { className: "col g4 min-w-0", children: [_jsxs("p", { className: "label", children: [today, " \u00B7 ", brandName] }), _jsx("h1", { className: "h2", id: "h-home", children: needsYou.length
                                    ? _jsxs(_Fragment, { children: [_jsx("span", { className: "w9", children: t(needsYou.length === 1 ? 'home.needsOne' : 'home.needsN', { n: needsYou.length }) }), " ", t('home.restMoving')] })
                                    : _jsxs(_Fragment, { children: [_jsx("span", { className: "w9", children: t('home.nothingNeeds') }), " ", t('home.possibleSub')] }) })] }), _jsx(TalkToNico, { brandName: brandName })] }), _jsx("div", { "data-tour": "home-brains", children: _jsx(HomeStudio, { requests: open }) })] }));
}
