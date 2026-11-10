import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { brainName } from '../components/BrainStack';
import { KIND_OF, RELAY, TASKS } from './teamWork';
import { LOG, VARIANT_OF } from './teamLog';
import { Scene, sayIn } from './TeamScenes';
import './teamAtWork.css';
/** Each Brain works for this long before passing the piece on; its log moves a line every third of it. */
const STEP_MS = 9000;
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Which Brain has the piece right now in the loop. Every card on screen shares the same clock, so they move together. */
function useRelay() {
    const at = () => Math.floor(Date.now() / STEP_MS) % RELAY.length;
    const [i, setI] = useState(at);
    useEffect(() => {
        if (still())
            return;
        const id = setInterval(() => setI(at()), 400);
        return () => clearInterval(id);
    }, []);
    return i;
}
/**
 * The four Brains working on a request, one after another like an agency team: Researcher, Marketer, Creator, Builder.
 * Beside them, the one at work is seen doing it (the search, the positioning map, the wireframe turning into the mockup,
 * the code going live), drawn for the kind of piece: a site, a logo, a video or a document. When the team left a note
 * for that Brain on this request, the note shows as its task. `compact` is the one-line version for the home cards.
 */
export function TeamAtWork({ r, compact = false }) {
    const { t, lang } = useI18n();
    const brand = useBrandsMaybe()?.current?.name ?? 'Braindy';
    const i = useRelay();
    const kind = KIND_OF[r.category] ?? 'study';
    const variant = VARIANT_OF[kind];
    // Live: the session doing the request moves real steps (work.steps). Without them, the loop shows how the team works.
    const steps = r.work?.steps?.length === RELAY.length ? r.work.steps : null;
    const stepOf = (b) => steps?.find((s) => s.brain === b);
    const doing = steps ? RELAY.findIndex((b) => stepOf(b)?.state === 'doing') : -1;
    const finished = !!steps && steps.every((s) => s.state === 'done' || s.state === 'skip');
    const live = steps ? (doing >= 0 ? doing : finished ? RELAY.length - 1 : Math.max(0, RELAY.findIndex((b) => stepOf(b)?.state === 'todo'))) : i;
    const task = (b) => { const s = stepOf(b); return (s?.state === 'done' && s.note) || s?.task?.trim() || r.teamNotes?.[b]?.trim() || TASKS[kind][b][lang]; };
    const stateOf = (b, k) => (steps ? stepOf(b)?.state ?? 'todo' : k === i ? 'doing' : k < i ? 'done' : 'todo');
    const now = RELAY[live];
    if (compact) {
        return (_jsxs("span", { className: "tw-mini row g8 min-w-0", children: [_jsx("span", { className: "row flex-none", children: RELAY.map((b, k) => (_jsx("span", { className: `brain xs b-${b} ${k === live && !finished ? 'brain-working' : stateOf(b, k) === 'done' ? '' : 'tw-off'}`, style: { marginLeft: k ? -5 : 0 }, children: _jsx("img", { src: `/brand/brains/${b}.png`, alt: "" }) }, b))) }), _jsx("span", { className: "t-xs t-mute truncate", children: finished ? t('tw.done') : _jsxs(_Fragment, { children: [_jsx("b", { className: "tw-who", style: { color: `var(--${now})` }, children: brainName(now) }), " ", task(now).charAt(0).toLowerCase() + task(now).slice(1)] }) }, now)] }));
    }
    return (_jsxs("section", { className: "card col g16 tw", "aria-labelledby": "h-team", children: [_jsxs("div", { className: "col g4", children: [_jsxs("h2", { className: "h3 row g8 wrap", id: "h-team", children: [t('tw.title'), steps && _jsx("span", { className: "chip chip-plain tw-live", children: finished ? t('tw.doneChip') : t('tw.live') })] }), _jsx("p", { className: "t-sm t-mute", children: t('tw.sub') })] }), _jsxs("div", { className: "tw-body", children: [_jsx("ol", { className: "tw-relay", children: RELAY.map((b, k) => {
                            const st = stateOf(b, k);
                            return (_jsxs("li", { className: `tw-step b-${b} ${st === 'doing' ? 'on' : st === 'done' ? 'done' : st === 'skip' ? 'skip' : ''}`, "aria-current": st === 'doing' ? 'step' : undefined, children: [_jsx("span", { className: `brain sm b-${b} ${st === 'doing' ? 'brain-working' : ''}`, children: _jsx("img", { src: `/brand/brains/${b}.png`, alt: "" }) }), _jsxs("span", { className: "col min-w-0", children: [_jsxs("b", { className: "t-sm", children: [brainName(b), steps && st !== 'todo' && _jsxs("span", { className: "t-xs t-mute w4", children: [" \u00B7 ", t(`tw.s.${st}`)] })] }), _jsx("span", { className: "t-xs t-mute", children: st === 'skip' ? t('tw.skipped') : task(b) }), !steps && k === i && (_jsx("span", { className: "tw-log", children: LOG[variant][b].map((l, n) => _jsxs("span", { style: { ['--d']: `${n * 3}s` }, children: [_jsx("i", {}), l[lang]] }, n)) }, now))] })] }, b));
                        }) }), _jsx(Scene, { brain: now, variant: variant, title: r.title, brand: brand, say: sayIn(lang) }, now)] })] }));
}
