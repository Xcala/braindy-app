import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { ago, eventText } from './BrainFeed';
import { useLastBrainEvent } from './useBrainEvents';
import './loop.css';
// Each step wears the colour of the Brain that leads it; the last one closes the loop back to the first.
const STEPS = [
    { k: 'ask', icon: 'plus', c: 'var(--researcher)' },
    { k: 'make', icon: 'spark', c: 'var(--creator)' },
    { k: 'approve', icon: 'check', c: 'var(--marketer)' },
    { k: 'learn', icon: 'repeat', c: 'var(--builder)' },
];
/** The four steps of the Brand Brain loop: ask, we make it, you approve, your Brain learns (and the next one is better). */
export function BrainLoopSteps({ on }) {
    const { t } = useI18n();
    return (_jsx("div", { className: "bl-wrap", children: _jsx("ol", { className: "bl-steps", "aria-label": t('bl.line'), children: STEPS.map((s) => (_jsxs("li", { className: `bl-step${on === s.k ? ' is-on' : ''}`, style: { ['--c']: s.c }, children: [_jsx("span", { className: "bl-ico", "aria-hidden": "true", children: _jsx(Icon, { name: s.icon, size: 16 }) }), _jsxs("span", { className: "col", children: [_jsx("span", { className: "t-sm w7", children: t(`bl.s.${s.k}`) }), _jsx("span", { className: "t-xs t-mute", children: t(`bl.s.${s.k}D`) })] })] }, s.k))) }) }));
}
/** Home: the loop in one strip, the last thing the Brain learned and a way into it. */
export function HomeBrainLoop({ brandId }) {
    const { t } = useI18n();
    const last = useLastBrainEvent(brandId);
    return (_jsxs("section", { className: "card bl-card col g16", "aria-labelledby": "h-bl", children: [_jsxs("div", { className: "row between g12 wrap", style: { alignItems: 'flex-start' }, children: [_jsxs("div", { className: "col g4", style: { maxWidth: 640 }, children: [_jsx("h2", { className: "h3", id: "h-bl", children: _jsx("span", { className: "w9", children: t('bl.line') }) }), _jsx("p", { className: "t-sm t-mute", children: t('bl.lineSub') })] }), _jsxs(Link, { to: "/brand/brain", className: "btn btn-secondary btn-sm", children: [t('bl.open'), _jsx(Icon, { name: "arrowRight", size: 16 })] })] }), _jsx(BrainLoopSteps, {}), last && (_jsxs(Link, { to: "/brand/brain", className: "bl-last t-sm", children: [_jsx("span", { className: "bl-dot", "aria-hidden": "true" }), _jsxs("span", { className: "t-mute", children: [t('bl.last'), ":"] }), " ", _jsx("span", { className: "truncate", children: eventText(last, t) }), _jsxs("span", { className: "t-xs t-mute", style: { flex: 'none' }, children: ["\u00B7 ", ago(last.at, t)] })] }))] }));
}
